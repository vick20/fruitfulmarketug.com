import type { ComponentPropsWithoutRef } from "react";

export default function MyFooter(
  props: ComponentPropsWithoutRef<"footer">
) {
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" {...props} className="bg-gray-900 text-white py-4 px-6">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {year} fruitful market ug. All rights reserved.
        </p>
      </div>
    </footer>
  );
}