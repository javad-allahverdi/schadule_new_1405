import * as React from "react";
const SvgPassword = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={64}
    height={64}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      stroke="#130F26"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={0.672}
    >
      <path
        d="M10.689 12a1.852 1.852 0 1 1-1.852-1.852h.003A1.85 1.85 0 0 1 10.689 12"
        clipRule="evenodd"
      />
      <path d="M10.692 12h6.318v1.852M14.182 13.852V12" />
      <path
        d="M2.75 12c0-6.937 2.313-9.25 9.25-9.25s9.25 2.313 9.25 9.25-2.313 9.25-9.25 9.25S2.75 18.937 2.75 12"
        clipRule="evenodd"
      />
    </g>
  </svg>
);
export default SvgPassword;
