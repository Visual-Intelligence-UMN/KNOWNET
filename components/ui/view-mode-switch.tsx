// ViewModeSwitch.tsx
'use client'
import * as React from 'react'
import * as Switch from '@radix-ui/react-switch'
import { useViewMode } from '@/components/ui/view-mode'

const ViewModeSwitch = () => {
  const { isPaneView, toggleViewMode } = useViewMode()
  return (
    <div className="flex items-center right-0">
      <Switch.Root
        className="w-[42px] h-[25px] bg-black rounded-full relative shadow-[0_2px_10px] shadow-blackA4 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-black outline-none cursor-default right-2"
        id="switch-mode"
        checked={isPaneView}
        onCheckedChange={toggleViewMode}
      >
        <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA4 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
      </Switch.Root>
      <label
        htmlFor="view-mode-switch"
        className="text-gray-700 dark:text-gray-200 text-sm leading-none pr-4"
      >
        {isPaneView ? 'Pane View' : 'Scroll View'}
      </label>
    </div>
  )
}

export default ViewModeSwitch
