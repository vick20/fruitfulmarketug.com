
"use client";

export type MenuToggleProps = {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  bg:string;
};

export default function MenuToggle({ isOpen, onToggle, bg }:MenuToggleProps) {
  function toggleMenu() {
    onToggle(!isOpen);
  }

  return (
    <button
      type="button"
      onClick={toggleMenu}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      className="flex flex-col justify-center items-center gap-1.5
                 w-10 h-10 rounded-lg "
    >
      <span className={`w-6 h-0.5 ${bg} rounded-full transition-all
        ${isOpen ? "translate-y-2 rotate-45" : ""}`} />

      <span className={`w-6 h-0.5 ${bg} rounded-full transition-all
        ${isOpen ? "opacity-0" : ""}`} />

      <span className={`w-6 h-0.5 ${bg} rounded-full transition-all
        ${isOpen ? "-translate-y-2 -rotate-45" : ""}`} />
    </button>
  );
}
