interface FormErrorProps {
    message?: string;
}

export default function FormError({ message }: FormErrorProps) {
    return message ? <p role="alert" className="mb-4 text-sm text-danger">{message}</p> : null;
}
