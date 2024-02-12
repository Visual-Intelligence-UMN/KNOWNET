import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

const SpeedDial = ({ actions }: { actions: any[] }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(!open)}>
        More...
      </Button>
      {open && (
        <div className="absolute bottom-full mb-2 flex flex-col items-end">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="mt-2"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
