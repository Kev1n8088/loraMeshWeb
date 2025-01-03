import { Subtle } from "@app/components/UI/Typography/Subtle.js";
import {
  type MessageWithState,
  useDevice,
} from "@app/core/stores/deviceStore.js";
import { Message } from "@components/PageComponents/Messages/Message.js";
import { MessageInput } from "@components/PageComponents/Messages/MessageInput.js";
import { ImageInput } from "@components/PageComponents/Messages/ImageInput.js";
import { SpeechInput } from "@components/PageComponents/Messages/SpeechInput.js";
import { PhotoInput } from "@components/PageComponents/Messages/PhotoInput.js";
import { TraceRoute } from "@components/PageComponents/Messages/TraceRoute.js";
import type { Protobuf, Types } from "@meshtastic/js";
import { InboxIcon } from "lucide-react";

export interface ChannelChatProps {
  messages?: MessageWithState[];
  channel: Types.ChannelNumber;
  to: Types.Destination;
  traceroutes?: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[];
}

function getPastMessages(mess: MessageWithState[], index: number) {
  if (mess[index].data.includes("$*#%$") === false) {
    return "not image";
  }
  const imgLength = Number.parseInt(mess[index].data.split("$")[3]);
  const arr = new Array<string>(imgLength);
  const t = mess[index].data.split("$")[2];
  if (index - imgLength < -1) {
    return "incomplete";
  }
  for (let i = index; i > index - imgLength; i--) {
    // biome-ignore lint/style/useTemplate: <explanation>
    if (mess[i].data.includes("$*#%$" + t)) {
      arr[Number.parseInt(mess[i].data.split("$")[0])] =
        mess[i].data.split("$")[4];
    } else {
      return "incomplete";
    }
  }
  return arr.join("\n");
}

export const ChannelChat = ({
  messages,
  channel,
  to,
  traceroutes,
}: ChannelChatProps): JSX.Element => {
  const { nodes } = useDevice();

  return (
    <div className="flex flex-grow flex-col">
      <div className="flex flex-grow">
        <div className="flex flex-grow flex-col">
          {messages ? (
            messages.map((message, index) => (
              <Message
                key={message.id}
                message={message}
                lastMsgSameUser={
                  index === 0
                    ? false
                    : messages[index - 1].from === message.from
                }
                prevMesImgs={getPastMessages(messages, index)}
                image={message.data.includes("$*#%$")}
                sender={nodes.get(message.from)}
              />
            ))
          ) : (
            <div className="m-auto">
              <InboxIcon className="m-auto" />
              <Subtle>No Messages</Subtle>
            </div>
          )}
        </div>
        <div
          className={`flex flex-grow flex-col border-slate-400 border-l ${traceroutes === undefined ? "hidden" : ""}`}
        >
          {to === "broadcast" ? null : traceroutes ? (
            traceroutes.map((traceroute, index) => (
              <TraceRoute
                key={traceroute.id}
                from={nodes.get(traceroute.from)}
                to={nodes.get(traceroute.to)}
                route={traceroute.data.route}
              />
            ))
          ) : (
            <div className="m-auto">
              <InboxIcon className="m-auto" />
              <Subtle>No Traceroutes</Subtle>
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <MessageInput to={to} channel={channel} />
      </div>
      <div className="p-4">
        <ImageInput to={to} channel={channel} />
      </div>
      <div className="p-4">
        <PhotoInput to={to} channel={channel} />
      </div>
    </div>
  );
};
