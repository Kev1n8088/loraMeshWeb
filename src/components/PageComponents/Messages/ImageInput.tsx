import { Button } from "@components/UI/Button.js";
import { FileInput } from "@components/UI/FileInput.js";
import { useDevice } from "@core/stores/deviceStore.js";
import type { Types } from "@meshtastic/js";
import { SendIcon } from "lucide-react";
import { stringify } from "node:querystring";

export interface ImageInputProps {
  to: Types.Destination;
  channel: Types.ChannelNumber;
}

export const ImageInput = ({ to, channel }: ImageInputProps): JSX.Element => {
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

  function handleOnChange(e: React.FormEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement & {
      files: FileList;
    };
    const file = target.files[0];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const url = reader.result as string;
      const img = new Image();
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set the canvas dimensions to the image dimensions
        const maxWidth = 300; // Set a maximum width for the resized image
        const maxHeight = 300; // Set a maximum height for the resized image
        let width = img.width;
        let height = img.height;

        // Calculate the new dimensions while maintaining the aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Compress the image
        let compressedUrl = canvas.toDataURL('image/jpeg', 0.7); // Adjust the quality as needed

        const len = compressedUrl.length;
        console.log('Compressed image size:', len);
        if (len < 10000) {
          setMessageArray([
            ...[Date.now().toString().slice(-4)],
            ...(compressedUrl.match(/[\s\S]{1,200}/g) || []),
          ]);
        } else {
          console.error('Image is still too large after compression');
        }
      };
    });

    reader.readAsDataURL(file);
  }
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
          setMessageArray([]);
          setFileDraft(Math.random().toString(36));
        }}
      >
        <div className="flex flex-grow gap-2">
          <FileInput onChange={handleOnChange} key={fileDraft || ""} />

          <Button type="submit">
            <SendIcon size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};
