import * as React from "react";
const SvgList = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={64}
    height={64}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={0.816}
      d="M8 6h13M8 12h13M8 18h13M3 6.5h1v-1H3zm0 6h1v-1H3zm0 6h1v-1H3z"
    />
  </svg>
);
export default SvgList;
