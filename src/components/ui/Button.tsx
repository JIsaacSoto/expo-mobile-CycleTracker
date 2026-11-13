import * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Button as RNPButton } from "react-native-paper";

interface Props {
  onPress: () => void;
  text: string;
  mode?: "contained" | "contained-tonal" | "outlined" | "text";
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
  buttonColor?: string;
  accessibilityLabel?: string;
}

const Button = ({
  onPress,
  text,
  mode = "contained",
  icon,
  disabled,
  loading,
  compact,
  style,
  textColor,
  buttonColor,
  accessibilityLabel,
}: Props) => (
  <RNPButton
    mode={mode}
    icon={icon}
    onPress={onPress}
    disabled={disabled}
    loading={loading}
    compact={compact}
    style={[{ borderRadius: 24 }, style]}
    contentStyle={compact ? undefined : { paddingVertical: 4 }}
    textColor={textColor}
    buttonColor={buttonColor}
    accessibilityLabel={accessibilityLabel ?? text}
  >
    {text}
  </RNPButton>
);

export default Button;
