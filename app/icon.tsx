import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Generated at build time, so there are no binary assets in the repo. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#191919",
          color: "#b77e64",
          fontSize: 300,
          fontFamily: "monospace",
        }}
      >
        t
      </div>
    ),
    size,
  );
}
