export interface DemoTableRow {
  id: number;
  name: string;
} 

export interface SocialLoginButtonProps {
  provider: string;
  className?: string;
}

export interface InputFieldProps {
  icon: string;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rightIcon?: string;
}