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
  if (steps === 1) {
    return null
  }
  const isLastStep = activeStep === steps - 1
  const isFirstStep = activeStep === 0

  const renderStepIndicator = () => {
    // If steps are too many, show in text format like "1/8"
    if (steps > 10) {
      return <div className="text-center">{`${activeStep + 1}/${steps}`}</div>
    }

    // Otherwise, render individual dots for each step
    return (
      <Stepper activeStep={activeStep}>
        {Array.from({ length: steps }, (_, index) => (
          <Step
            key={index}
            className="h-6 w-6 flex items-center justify-center rounded-full bg-gray-300 text-gray-600 cursor-pointer"
            onClick={() => handleBack()}
            style={{ padding: '4px' }}
          >
            {index + 1}
          </Step>
        ))}
      </Stepper>
    )
  }

  return (
    <div className="pt-16 px-5">
      {renderStepIndicator()}
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
