'use client'
import React from 'react'
import { Stepper, Step, Button } from '@material-tailwind/react'

type DotsMobileStepperProps = {
  steps: number
  activeStep: number
  handleNext: () => void
  handleBack: () => void
}

export default function DotsMobileStepper({
  steps,
  activeStep,
  handleNext,
  handleBack
}: DotsMobileStepperProps) {
  const isLastStep = activeStep === steps - 1
  const isFirstStep = activeStep === 0
  // Define your custom theme here

  return (
    <div className="pt-16 px-5">
      <Stepper activeStep={activeStep}>
        {Array.from({ length: steps }, (_, index) => (
          <Step key={index} className="h-3 w-3" onClick={() => handleBack()} />
        ))}
      </Stepper>
      <div className="mt-4 flex justify-between">
        <Button onClick={handleBack} disabled={isFirstStep}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={isLastStep}>
          Next
        </Button>
      </div>
    </div>
  )
}
