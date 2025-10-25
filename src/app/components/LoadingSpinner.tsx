import LoadingSpinnerWhite from "./LoadingSpinnerWhite";

interface LoadingSpinnerProps {
  message?: string;
  duration?: number;
}

export default function LoadingSpinner({
  message = "Loading...",
  duration = 3,
}: LoadingSpinnerProps) {
  return <LoadingSpinnerWhite message={message} duration={duration} />;
}
