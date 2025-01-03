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
      const url = reader.result;
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
