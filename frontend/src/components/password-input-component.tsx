import { CheckCircle, InfoIcon} from "lucide-react"
import { useEffect, useState } from 'react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ValidityMatrix {
  hasUppercase: boolean;
  hasLowercase: boolean; 
  hasNumber: boolean;
  hasSpecial: boolean;
  minLength: boolean;
};

interface ComponentProps {
  passwordInput: string;
  passwordValid: (isValid: boolean) => void;
  setPassword: (pass: string) => void;
}

export function PasswordInput({passwordInput, passwordValid, setPassword}: ComponentProps) {
    const [isPasswordValid, setValidPasswordBool] = useState<boolean>(false);
    // const [validPassword, setValidPassword] = useState<string>("");
    const [validityMatrix, setValidityMatrix] = useState<ValidityMatrix>(
      {
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        minLength: false
      }
    )

    useEffect(() => {
      function validatePassword(): void {
        const hUC = /[A-Z]/.test(passwordInput);
        const hLC = /[a-z]/.test(passwordInput);
        const hN = /\d/.test(passwordInput);
        const hS = /[!@#$%^&*(),.?":{}|<>]/.test(passwordInput);
        const mL = passwordInput.length >= 8;

        setValidityMatrix( {
          hasUppercase: hUC, 
          hasLowercase: hLC, 
          hasNumber: hN,
          hasSpecial: hS,
          minLength: mL 
      })
    }
      validatePassword();
    }, [passwordInput])


    useEffect(() => {
      const validMatrix: ValidityMatrix = { 
        hasUppercase: true, 
        hasLowercase: true, 
        hasNumber: true, 
        hasSpecial: true, 
        minLength:true
       };
      if (JSON.stringify(validityMatrix) === JSON.stringify(validMatrix)) {
        setValidPasswordBool(true);
        passwordValid(true);
      }  else {
        setValidPasswordBool(false);
        passwordValid(false)
      }
    }, [validityMatrix, passwordValid])

  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupInput placeholder="Enter password" type="password" value={passwordInput} onChange={ event => setPassword(event.target.value)} />
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton
                variant="ghost"
                aria-label="Info"
                size="icon-xs"
              >
                {isPasswordValid ?<CheckCircle className="text-green-600" /> : <InfoIcon className="text-red-600"/>}
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent className="gap-5">
              { isPasswordValid ? <p>Password is valid</p> : <>
                <p>Password must have at least 8 characters {}</p>
                <p>Password must have at least one uppercase character</p>
                <p>Password must have at least one number</p>
                <p>Password must have special characters: {'!@#$%^&*(),.?":{}|<>'}</p>
                <p>Password must contain lowercase letters</p>
              </>}
            </TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
