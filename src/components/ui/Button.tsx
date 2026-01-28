import * as React from 'react';
import { Button as RNPButton } from 'react-native-paper';

interface Props {
  onPress: () => void;
  text: string;
}

const Button = ({ onPress, text }: Props) => (
  <RNPButton 
    mode="contained" 
    buttonColor="#AD404A" 
    onPress={onPress}
  >
    {text}
  </RNPButton>
);

export default Button;
