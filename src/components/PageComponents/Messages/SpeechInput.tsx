import { Button } from "@components/UI/Button.js";
import { FileInput } from "@components/UI/FileInput.js";
import { useDevice } from "@core/stores/deviceStore.js";
import type { Types } from "@meshtastic/js";
import { SendIcon } from "lucide-react";
import { stringify } from "node:querystring";
import React, { useState, useEffect } from 'react';
import { arrayBuffer } from "stream/consumers";

export interface SpeechInputProps {
  to: Types.Destination;
  channel: Types.ChannelNumber;
}

let stream: MediaStream;
let audioContext: AudioContext;
let input: MediaStreamAudioSourceNode;
let mediaRecorder: MediaRecorder;
let rawChunks: BlobPart[] = [];

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

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isRecording) {
      timeoutId = setTimeout(() => {
        stopRecording();
      }, 5000); // Automatically stop recording after 5 seconds
    }
    return () => clearTimeout(timeoutId);
  }, [isRecording]);

  const initializeRecorder = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.AudioContext)();
    input = audioContext.createMediaStreamSource(stream);

    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 4000,
    };

    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      rawChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      console.log('MediaRecorder stopped');
      const rawBlob = new Blob(rawChunks, { type: 'audio/wav' });
      rawChunks = [];

      const reader2 = new FileReader();
      reader2.readAsDataURL(rawBlob);
      reader2.onloadend = () => {
        const url = reader2.result as string;
        console.log(url);
        setMessageArray([url]);
        if (typeof url === "string") {
          const len = url.length;
          if (len < 10000) {
            setMessageArray([
              ...[Date.now().toString().slice(-4)],
              ...(url.match(/[\s\S]{1,200}/g) || []),
            ]);
          } else {
            setMessageArray([]);
          }
        }

      };

    };

  };

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
  const startRecording = async () => {
    if (!isRecording) {
      setMessageArray([]);
      setFileDraft(Math.random().toString(36));
      await initializeRecorder();
      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");


    }
  };

  const stopRecording = () => {
    if (isRecording) {
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log("Recording stopped");
    }
  };

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
                "@*#%@" +
                messageArray[0] +
                "@" +
                (messageArray.length - 1) +
                "@" +
                messageArray[i];
              sendText(k);
              await delay(500)
            }
          }
          setMessageArray([]);
          setFileDraft(Math.random().toString(36));
        }}
      >
        <div className="flex flex-grow gap-2">
          <button onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? 'Stop Recording (max 5 secs)' : 'Start Recording'}
          </button>

          <Button type="submit">
            <SendIcon size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};