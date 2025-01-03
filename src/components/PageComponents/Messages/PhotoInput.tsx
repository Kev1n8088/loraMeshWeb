import { Button } from "@components/UI/Button.js";
import { FileInput } from "@components/UI/FileInput.js";
import { useDevice } from "@core/stores/deviceStore.js";
import type { Types } from "@meshtastic/js";
import { SendIcon } from "lucide-react";
import { stringify } from "node:querystring";
import React, { useState, useRef } from 'react';

export interface PhotoInputProps {
  to: Types.Destination;
  channel: Types.ChannelNumber;
}

export const PhotoInput = ({ to, channel }: PhotoInputProps): JSX.Element => {
  const {
    connection,
    setMessageState,
    fileDraft,
    setFileDraft,
    messageArray,
    setMessageArray,
    hardware,
  } = useDevice();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const myNodeNum = hardware.myNodeNum;

  const sendText = async (message: string) => {
    await connection
      ?.sendText(message, to, true, channel)
      .then((id) =>
        setMessageState(
          to === "broadcast" ? "broadcast" : "direct",
          channel,
          to as number,
          myNodeNum,
          id,
          "ack",
        ),
      )
      .catch((e: Types.PacketError) =>
        setMessageState(
          to === "broadcast" ? "broadcast" : "direct",
          channel,
          to as number,
          myNodeNum,
          e.id,
          e.error,
        ),
      );
  };

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        console.log("Starting capture");
      }else{
        console.log("videoRef is null")
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 256, 256);
        const base64Image = canvasRef.current.toDataURL('image/jpeg');
        const len = base64Image.length;
        if (len < 10000) {
          setMessageArray([
            ...[Date.now().toString().slice(-4)],
            ...(base64Image.match(/[\s\S]{1,200}/g) || []),
          ]);
        } else {
          setMessageArray([]);
        }
      }
      setIsCapturing(false);
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  return (
    <div className="flex gap-2">
      <form
        className="w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          if (messageArray.length !== 0) {
            for (let i = 1; i < messageArray.length; i++) {
              const k =
                // biome-ignore lint/style/useTemplate: <too lazy>
                (i - 1).toString() +
                "$*#%$" +
                messageArray[0] +
                "$" +
                (messageArray.length - 1) +
                "$" +
                messageArray[i];
              sendText(k);
              await delay(500)
            }
          }
          setFileDraft(Math.random().toString(36));
        }}
      >
        <div className="flex flex-grow gap-2">
          {isCapturing ? (
            <>
              <video ref={videoRef} width="256" height="256" />
              <button type="button" onClick={capturePhoto}>
                Capture Photo
              </button>
            </>
          ) : (
            <button type="button" onClick={startCapture}>
              Start Capture
            </button>
          )}
          <Button type="submit">
            <SendIcon size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};
