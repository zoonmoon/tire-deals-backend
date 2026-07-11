import React from "react";
import CircularProgress from "@mui/material/CircularProgress";

const CustomButton = ({
  children,
  startDecorator,
  endDecorator,
  onClick,
  variant = "filled",
  color = "#0B33A0",
  textColor,
  disabled = false,
    loading = false,   // 👈 add this
  hoverBackgroundColor = "#F46C15",
  sx = {},
  ...props
}) => {
  const isFilled = variant === "filled";
  const isOutlined = variant === "outlined";
const isDisabled = disabled || loading;
const contentRef = React.useRef(null);
const [minWidth, setMinWidth] = React.useState(null);



React.useEffect(() => {
  if (contentRef.current && !loading) {
    // setMinWidth(contentRef.current.offsetWidth);
  }
}, [loading, children]);



  const baseStyle = {
    display: "inline-flex", // inline-flex usually behaves better
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "10px 20px",
    fontSize: "16px",
    fontWeight: 600,
    borderRadius: "4px",
    border: isOutlined ? `2px solid ${color}` : "none",
    backgroundColor: isFilled ? color : "transparent",
    color: textColor || (isFilled ? "#fff" : color),
    // cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease-in-out",
    textTransform: "none",
    cursor: isDisabled ? "not-allowed" : "pointer",
    // opacity: isDisabled ? 0.: 1,
    outline: "none",
    lineHeight: 1, // ensure vertical alignment
    ...sx,
  };

  const iconStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "inherit", // make icon inherit the button color
  };

const hoverStyle =
  !isDisabled && !loading
    ? isFilled
      ? { backgroundColor: hoverBackgroundColor }
      : { backgroundColor: hoverBackgroundColor }
    : {};

  return (
<button
  onClick={onClick}
  disabled={isDisabled}
  style={{
    ...baseStyle,
    // minWidth: minWidth ? `${minWidth}px` : undefined,
  }}
  onMouseEnter={e => Object.assign(e.currentTarget.style, hoverStyle)}
  onMouseLeave={e => Object.assign(e.currentTarget.style, baseStyle)}
  {...props}
>
  <span
    ref={contentRef}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {loading ? (
      <CircularProgress
        size={20}
        thickness={5}
        sx={{ color: isFilled ? "#fff" : color }}
      />
    ) : (
      <>
        {startDecorator && <span style={iconStyle}>{startDecorator}</span>}
        <span style={{ display: "flex", alignItems: "center" }}>
          {children}
        </span>
        {endDecorator && <span style={iconStyle}>{endDecorator}</span>}
      </>
    )}
  </span>
</button>

  );
};

export default CustomButton;
