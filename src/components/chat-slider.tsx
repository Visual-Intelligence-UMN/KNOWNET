'use client'
import React from 'react'
import { Stepper, Step, Tooltip } from '@material-tailwind/react'
import { Button } from './ui/button'
import {type Message } from 'ai/react'

type sliderProps = {
  messages: Message[]
  steps: number
  activeStep: number
  handleNext: () => void
  handleBack: () => void
  jumpToStep: (step: number) => void
}


export default function Slider({
  messages,
  steps,
  activeStep,
  handleNext,
  handleBack,
  jumpToStep,
}: sliderProps) {
  // console.log("steps", steps)
  const isLastStep = activeStep === steps - 1
  const isFirstStep = activeStep === 0

  const renderTest = () => {
    if (steps >= 10) {
      // steps > 10 
      return <div className="text-center">{`${activeStep + 1}/${steps}`}</div>
    }
    
    return (
      <Stepper
        activeStep = {activeStep}
      >
        {Array.from({length: steps}, (_, index) =>(
          <Tooltip key={index} content={messages[index*2]['content']}>
              <Step
                key={index}
              className={`size-3 flex items-center justify-center rounded-full ${index<=activeStep ? 'bg-black text-white':'bg-gray-300 text-gray-600'} cursor-pointer`}
              // onClick={() => handleBack()}
              onClick={() => jumpToStep(index)}
              style={{ padding: '2px' }}
            >
              {index + 1}
            </Step>
          </Tooltip>
        ))}

      </Stepper>
    )
  }

  // const renderStepIndicator = () => {
  //   // If steps are too many, show in text format like "1/8"
  //   if (steps > 10) {
  //     return <div className="text-center">{`${activeStep + 1}/${steps}`}</div>
  //   }
  //   // Otherwise, render individual dots for each step
  //   return (
  //     <Stepper 
  //       activeStep={activeStep}
  //     >
  //       {Array.from({ length: steps }, (_, index) => (
  //         <Tooltip key={index} content={messages[index*2]['content']}>
  //           <Step
  //             key={index}
  //             className={`size-3 flex items-center justify-center rounded-full ${index<=activeStep ? 'bg-black text-white':'bg-gray-300 text-gray-600'} cursor-pointer`}
  //             // onClick={() => handleBack()}
  //             onClick={() => jumpToStep(index)}
  //             style={{ padding: '2px' }}
  //           >
  //             {index + 1}
  //           </Step>
  //         </Tooltip>
  //       ))}
  //     </Stepper>
  //   )
  // }

  return (
    <div className="px-5 w-[80vw]">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
          className="mr-2"
        >
          Back
        </Button>
        {/* {renderStepIndicator()} */}
        {renderTest()}
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={isLastStep}
          className="ml-2"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
