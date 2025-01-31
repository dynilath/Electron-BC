import { net, protocol, shell, WindowOpenHandlerResponse } from "electron";
import { readFileSync } from "fs";
import path from "path";
import { showPromptLoadurl } from "./main/Prompts";
import { AssetCache } from "./caching/AssetCache";

interface ProtocolSetting {
  urlPrefix: string;
  version: string;
}

async function requestAssetResponse(
  ...args: Parameters<typeof AssetCache.requestAsset>
) {
  const { buffer, type } = await AssetCache.requestAsset(...args);
  return new Response(buffer, {
    status: 200,
    statusText: "OK",
    headers: {
      ...(type ? { "Content-Type": type } : {}),
      "Content-Length": buffer.length.toString(),
    },
  });
}

export function setupProtocol(bcStatus: ProtocolSetting) {
  protocol.handle("ebc", async (request) => {
    const url = request.url.substring(6);
    const filePath = path.join(__dirname, url);
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      return new Response(fileContent, {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
    } catch (error) {
      return new Response("File not found", { status: 404 });
    }
  });

  protocol.handle("https", async (request) => {
    if (request.url.startsWith(bcStatus.urlPrefix)) {
      const assetKey = request.url.substring(
        request.url.lastIndexOf("BondageClub/") + 12
      );

      if (
        request.url.endsWith(".png") ||
        request.url.endsWith(".txt") ||
        request.url.endsWith(".csv")
      ) {
        return requestAssetResponse(request.url, assetKey, bcStatus.version);
      }
    }

    // Cache for Echo's mod
    if (request.url.startsWith("https://emdsa2.github.io/-mod/")) {
      if (request.url.endsWith(".png")) {
        const v_start = request.url.indexOf("v=", request.url.indexOf("?") + 1);
        const version = request.url.substring(
          v_start + 2,
          Math.min(v_start + 9, request.url.length)
        );
        return requestAssetResponse(request.url, request.url, version);
      }
    }

    return net.fetch(request, { bypassCustomProtocolHandlers: true });
  });
}

export function windowOpenRequest(url: string): WindowOpenHandlerResponse {
  if (url === "about:blank") {
    return { action: "allow" };
  }

  if (url.endsWith(".user.js")) {
    showPromptLoadurl(url);
    return { action: "deny" };
  }

  shell.openExternal(url);
  return { action: "deny" };
}
