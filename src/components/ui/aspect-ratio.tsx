"use client";

import * as React from "react";
import { Root as AspectRatioRoot } from "@radix-ui/react-aspect-ratio";

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioRoot>) {
  return <AspectRatioRoot data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
