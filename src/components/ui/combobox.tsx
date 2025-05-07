import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboboxProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  // Handle clicking outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle option selection
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setIsOpen(false)
    setSearchTerm("")
  }

  // Get the display value
  const displayValue = React.useMemo(() => {
    if (!value) return ""
    const option = options.find(opt => opt.value === value)
    return option ? option.label : ""
  }, [options, value])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input field */}
      <div
        className={cn(
          "flex items-center w-full h-9 px-3 py-1 border rounded-md text-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500",
          isOpen ? "border-blue-500" : "border-input",
          disabled ? "opacity-50 cursor-not-allowed bg-muted" : "bg-background",
          className
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true)
            setTimeout(() => {
              inputRef.current?.focus()
            }, 0)
          }
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground"
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={cn("flex-1", !displayValue && "text-muted-foreground")}>
            {displayValue || placeholder}
          </span>
        )}
        <Search className="h-4 w-4 shrink-0 opacity-50 ml-2" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <ul>
              {filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
