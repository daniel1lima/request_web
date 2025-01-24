import React from 'react';

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center">
      <img
        loading="lazy"
        srcSet="https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true&width=100 100w, https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true&width=200 200w, https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true&width=400 400w, https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true&width=800 800w, https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true&width=1200 1200w, https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true&width=1600 1600w, https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true&width=2000 2000w, https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/13141fa6dc4379e80ac52a140ed384d5d54fab9bf80e7a6a7abaa3b346558a01?placeholderIfAbsent=true"
        className="aspect-[1.04] object-contain w-[198px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] self-center max-w-full mt-[35px]"
        alt="No song selected"
      />
      <h2 className="text-[rgba(52,75,103,1)] text-lg font-medium leading-[34px] text-center self-center mt-[17px]">
        No Song Selected
      </h2>
      <p className="bg-blend-normal text-[rgba(52,75,103,1)] text-base font-light leading-7 text-center self-center mt-[7px]">
        Select any song to request from the button above.
      </p>
    </div>
  );
};