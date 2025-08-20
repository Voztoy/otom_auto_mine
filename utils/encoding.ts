import { OtomTokenMetadata } from "./types";

export const parseTokenURI = (uri: string): OtomTokenMetadata | null => {
  try {
    const split = uri.split(",");
    const lastChunk = split[split.length - 1];
    const data = atob(lastChunk);
    return JSON.parse(data) as OtomTokenMetadata;
  } catch (e) {
    return null;
  }
};
