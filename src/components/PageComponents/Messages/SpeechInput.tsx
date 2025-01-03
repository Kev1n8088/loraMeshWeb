import { Button } from "@components/UI/Button.js";
import { FileInput } from "@components/UI/FileInput.js";
import { useDevice } from "@core/stores/deviceStore.js";
import type { Types } from "@meshtastic/js";
import { SendIcon } from "lucide-react";
import { stringify } from "node:querystring";
import React, { useState } from 'react';

export interface SpeechInputProps {
  to: Types.Destination;
  channel: Types.ChannelNumber;
}

export const SpeechInput = ({ to, channel }: SpeechInputProps): JSX.Element => {
  const {
    connection,
    setMessageState,
    fileDraft,
    setFileDraft,
    messageArray,
    setMessageArray,
    hardware,
  } = useDevice();

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

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleRecordAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/ogg' });
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000); // Record for 10 seconds

      mediaRecorder.onstop = async () => {
        console.log("Done recording");
        const audioBlob = new Blob(audioChunks, { type: 'audio/ogg' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64AudioMessage = reader.result as string;
          const len = base64AudioMessage.length;
          if (len < 10000) {
            setMessageArray([
              ...[Date.now().toString().slice(-4)],
              ...(base64AudioMessage.match(/[\s\S]{1,200}/g) || []),
            ]);
          } else {
            console.log(len);
            setMessageArray([]);
          }
        };
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <form
        className="w-full"
        onSubmit={async(e) => {
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
              await delay(500);
            }
          }
          setFileDraft(Math.random().toString(36));
        }}
      >
        <div className="flex flex-grow gap-2">
          <button type="button" onClick={handleRecordAudio}>
            Record Audio
          </button>
          <Button type="submit">
            <SendIcon size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};
