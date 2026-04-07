// ════════════════════════════════════════════════════
// LINE Flex Message Types
// TypeScript definitions for LINE Messaging API Flex Message format
// Reference: https://developers.line.biz/en/docs/messaging-api/flex-message-elements/
// ════════════════════════════════════════════════════

// ===== Actions =====

export interface FlexUriAction {
  type: "uri";
  label: string;
  uri: string;
}

export interface FlexPostbackAction {
  type: "postback";
  label: string;
  data: string;
  displayText?: string;
}

export interface FlexMessageAction {
  type: "message";
  label: string;
  text: string;
}

export type FlexAction = FlexUriAction | FlexPostbackAction | FlexMessageAction;

// ===== Components =====

export interface FlexText {
  type: "text";
  text: string;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "3xl" | "4xl" | "5xl";
  color?: string;
  weight?: "regular" | "bold";
  align?: "start" | "end" | "center";
  wrap?: boolean;
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  flex?: number;
  style?: "normal" | "italic";
  decoration?: "none" | "underline" | "line-through";
  maxLines?: number;
  action?: FlexAction;
}

export interface FlexImage {
  type: "image";
  url: string;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "3xl" | "4xl" | "5xl" | "full";
  aspectRatio?: string;
  aspectMode?: "cover" | "fit";
  align?: "start" | "end" | "center";
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  flex?: number;
  action?: FlexAction;
}

export interface FlexSeparator {
  type: "separator";
  color?: string;
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
}

export interface FlexFiller {
  type: "filler";
  flex?: number;
}

export interface FlexButton {
  type: "button";
  action: FlexAction;
  style?: "primary" | "secondary" | "link";
  color?: string;
  height?: "sm" | "md";
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  flex?: number;
  gravity?: "top" | "bottom" | "center";
}

export interface FlexIcon {
  type: "icon";
  url: string;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "3xl" | "4xl" | "5xl";
  aspectRatio?: string;
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
}

export interface FlexBox {
  type: "box";
  layout: "vertical" | "horizontal" | "baseline";
  contents: FlexComponent[];
  flex?: number;
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  paddingAll?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingStart?: string;
  paddingEnd?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  cornerRadius?: string;
  width?: string;
  height?: string;
  action?: FlexAction;
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  alignItems?: "flex-start" | "center" | "flex-end";
  position?: "relative" | "absolute";
  offsetTop?: string;
  offsetBottom?: string;
  offsetStart?: string;
  offsetEnd?: string;
}

export type FlexComponent =
  | FlexBox
  | FlexText
  | FlexImage
  | FlexSeparator
  | FlexFiller
  | FlexButton
  | FlexIcon;

// ===== Block Styles =====

export interface BlockStyle {
  backgroundColor?: string;
  separator?: boolean;
  separatorColor?: string;
}

export interface FlexBubbleStyles {
  header?: BlockStyle;
  hero?: BlockStyle;
  body?: BlockStyle;
  footer?: BlockStyle;
}

// ===== Bubble & Carousel =====

export interface FlexBubble {
  type: "bubble";
  size?: "nano" | "micro" | "kilo" | "mega" | "giga";
  header?: FlexBox;
  hero?: FlexImage;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: FlexBubbleStyles;
}

export interface FlexCarousel {
  type: "carousel";
  contents: FlexBubble[];
}

export type FlexContainer = FlexBubble | FlexCarousel;

// ===== LINE Message Wrapper =====

export interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: FlexContainer;
}

export interface LineTextMessage {
  type: "text";
  text: string;
}

export type LineMessage = LineFlexMessage | LineTextMessage;
