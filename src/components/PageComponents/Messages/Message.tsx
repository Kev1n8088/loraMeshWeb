import type { MessageWithState } from "@app/core/stores/deviceStore.js";
import { Hashicon } from "@emeraldpay/hashicon-react";
import type { Protobuf } from "@meshtastic/js";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleEllipsisIcon,
} from "lucide-react";

export interface MessageProps {
  lastMsgSameUser: boolean;
  prevMes: string;
  message: MessageWithState;
  sender?: Protobuf.Mesh.NodeInfo;
  type: string;
}

export const Message = ({
  lastMsgSameUser,
  prevMes,
  message,
  sender,
  type,
}: MessageProps): JSX.Element => {
  console.log(prevMes);
  return lastMsgSameUser ? (
    <div className="ml-5 flex">
      {message.state === "ack" ? (
        <CheckCircle2Icon size={16} className="my-auto text-textSecondary" />
      ) : message.state === "waiting" ? (
        <CircleEllipsisIcon size={16} className="my-auto text-textSecondary" />
      ) : (
        <AlertCircleIcon size={16} className="my-auto text-textSecondary" />
      )}
      <span
        className={`ml-4 border-l-2 border-l-backgroundPrimary pl-2 ${message.state === "ack" ? "text-textPrimary" : "text-textSecondary"
          }`}
        style={{ display: "inline-block" }}
      >
        {prevMes === "text" ? (
          message.data
        ) : prevMes === "iincom" ? (
          "Image Incomplete"
        ) : prevMes === "aincom" ? (
          "Audio Incomplete"
        ) : prevMes.includes("iiiii") ? (
          <img src={prevMes.slice(5)} alt="" />
        ) : prevMes.includes("aaaaa") ? (
          <a href={prevMes.slice(5)}> <u>"Audio Link"</u> </a>
        ) : null
        }
      </span>
    </div>
  ) : (
    <div className="mx-4 mt-2 gap-2">
      <div className="flex gap-2">
        <div className="w-6 cursor-pointer">
          <Hashicon value={(sender?.num ?? 0).toString()} size={32} />
        </div>
        <span className="cursor-pointer font-medium text-textPrimary">
          {sender?.user?.longName ?? "UNK"}
        </span>
        <span className="mt-1 font-mono text-xs text-textSecondary">
          {message.rxTime.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="ml-1 flex">
        {message.state === "ack" ? (
          <CheckCircle2Icon size={16} className="my-auto text-textSecondary" />
        ) : message.state === "waiting" ? (
          <CircleEllipsisIcon
            size={16}
            className="my-auto text-textSecondary"
          />
        ) : (
          <AlertCircleIcon size={16} className="my-auto text-textSecondary" />
        )}
        <span
          className={`ml-4 border-l-2 border-l-backgroundPrimary pl-2 ${message.state === "ack" ? "text-textPrimary" : "text-textSecondary"
            }`}
          style={{ display: "inline-block" }}
        >
          {prevMes === "text" ? (
            message.data
          ) : prevMes === "iincom" ? (
            "Image Incomplete"
          ) : prevMes === "aincom" ? (
            "Audio Incomplete"
          ) : prevMes.includes("iiiii") ? (
            <img src={prevMes.slice(5)} alt="" />
          ) : prevMes.includes("aaaaa") ? (
            <a href={prevMes.slice(5)}> <u>"Audio Link"</u> </a>
          ) : null
          }
        </span>
      </div>
    </div>
  );
};
