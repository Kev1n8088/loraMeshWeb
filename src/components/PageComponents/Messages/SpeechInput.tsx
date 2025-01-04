import { Button } from "@components/UI/Button.js";
import { FileInput } from "@components/UI/FileInput.js";
import { useDevice } from "@core/stores/deviceStore.js";
import type { Types } from "@meshtastic/js";
import { SendIcon } from "lucide-react";
import { stringify } from "node:querystring";
import React, { useState } from 'react';
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

  let isRecording = false;

  const initializeRecorder = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.AudioContext)();
    input = audioContext.createMediaStreamSource(stream);

    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 4000,
    };

    mediaRecorder = new MediaRecorder(stream, options);
  };


  // const encodeRaw = async (arrayBuffer: ArrayBuffer) => {

  //   const encodeWorker = new Worker('encoderWorker.min.js');
  //   const bufferLength = 4096;
  //   let completeOggData = new Uint8Array(0);

  //   const concatUint8Arrays = (a: Uint8Array, b: Uint8Array) => {
  //     const c = new Uint8Array(a.length + b.length);
  //     c.set(a);
  //     c.set(b, a.length);
  //     return c;
  //   };

  //   const chunkBuffers = (arrayBuffer: ArrayBuffer, chunkLength: number) => {
  //     const chunkedBuffers: Float32Array[] = [];
  //     const totalFile = new Int16Array(arrayBuffer);

  //     for (let i = 22; i < totalFile.length; i += chunkLength) {
  //       const bufferChunk = new Float32Array(chunkLength);
  //       for (let j = 0; j < chunkLength; j++) {
  //         bufferChunk[j] = (totalFile[i + j] + 0.5) / 32767.5;
  //       }
  //       chunkedBuffers.push(bufferChunk);
  //     }

  //     return chunkedBuffers;
  //   };

  //   encodeWorker.postMessage({
  //     command: 'init',
  //     encoderSampleRate: 8000,
  //     bufferLength: bufferLength,
  //     originalSampleRate: 88200,
  //     encoderApplication: 2048,
  //     encoderComplexity: 10,
  //     resampleQuality: 10,
  //     numberOfChannels: 1,
  //     recordingGain: 1,
  //   });

  //   encodeWorker.postMessage({ command: 'getHeaderPages' });

  //   chunkBuffers(arrayBuffer, bufferLength).forEach((bufferChunk) =>
  //     encodeWorker.postMessage({
  //       command: 'encode',
  //       buffers: [bufferChunk],
  //     })
  //   );

  //   encodeWorker.postMessage({ command: 'done' });

  //   encodeWorker.onmessage = ({ data }) => {
  //     if (data.message === 'done') {
  //       const dataBlob = new Blob([completeOggData], { type: 'audio/ogg' });
  //       const reader = new FileReader();
  //       reader.readAsDataURL(dataBlob);
  //       reader.onloadend = () => {
  //         const url = reader.result as string;
  //         console.log(url);
  //         setMessageArray([url]);
  //       };
  //     } else if (data.message === 'page') {
  //       completeOggData = concatUint8Arrays(completeOggData, data.page);
  //     }
  //   };
  // };

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

  // const handleOnChange = (e: React.FormEvent<HTMLInputElement>) => {
  //   const target = e.target as HTMLInputElement;
  //   const reader = new FileReader();

  //   reader.addEventListener("load", () => {
  //     encodeRaw(reader.result as ArrayBuffer);
  //   });

  //   if (target.files && target.files[0]) {
  //     reader.readAsArrayBuffer(target.files[0]);
  //   }
  // }

  const handleRecordAudio = async () => {
    if (!mediaRecorder) {
      await initializeRecorder();
    }

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      rawChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      console.log('MediaRecorder stopped');
      const rawBlob = new Blob(rawChunks, { type: 'audio/wav' });
      rawChunks = []; // Clear the raw chunks for the next recording

      // Convert the raw audio data to an ArrayBuffer
      // const reader = new FileReader();
      // reader.readAsArrayBuffer(rawBlob);
      // reader.onloadend = async () => {
      //   let arrayBuffer = reader.result as ArrayBuffer;

      //   // Normalize the ArrayBuffer length to be a multiple of 2
      //   if (arrayBuffer.byteLength % 2 !== 0) {
      //     const normalizedBuffer = new ArrayBuffer(arrayBuffer.byteLength + 1);
      //     const view = new Uint8Array(normalizedBuffer);
      //     view.set(new Uint8Array(arrayBuffer));
      //     arrayBuffer = normalizedBuffer;
      //   }

      //   await encodeRaw(arrayBuffer);
      // };

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


    if (mediaRecorder.state === 'recording') {
      // Stop recording
      console.log('Stopping recording...');
      mediaRecorder.stop();
    } else {
      // Start recording
      console.log('Starting recording...');
      rawChunks = [];
      mediaRecorder.start();
      isRecording = true;

      // Stop recording after 10 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        isRecording = false;
      }, 5000);
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
          <button onClick={handleRecordAudio}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          <Button type="submit">
            <SendIcon size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};