import React from 'react';
import { DigitalGift, RecipientGiftResponse } from '../../types/digitalGifts';
import { EverTideIslandExperience } from './EverTideIslandExperience';
import { OurMuseumExperience } from './OurMuseumExperience';
import { ParisTogetherExperience } from './ParisTogetherExperience';
import { KittyLetterExperience } from './KittyLetterExperience';
import { SakuraNightExperience } from './SakuraNightExperience';
import { InfiniteLoveExperience } from './InfiniteLoveExperience';
import { MemoryArchiveExperience } from './MemoryArchiveExperience';

interface Props {
  gift: DigitalGift;
  isPreview?: boolean;
  onRespond?: (response: RecipientGiftResponse) => Promise<void>;
  onClose?: () => void;
}

export function DigitalGiftExperienceRenderer({ gift, isPreview, onRespond, onClose }: Props) {
  switch (gift.productId) {
    case 'ever_tide':
      return <EverTideIslandExperience gift={gift} isPreview={isPreview} onRespond={onRespond} onClose={onClose} />;
    case 'our_museum':
      return <OurMuseumExperience gift={gift} isPreview={isPreview} onClose={onClose} />;
    case 'paris_together':
      return <ParisTogetherExperience gift={gift} isPreview={isPreview} onRespond={onRespond} onClose={onClose} />;
    case 'kitty_letter':
      return <KittyLetterExperience gift={gift} isPreview={isPreview} onRespond={onRespond} onClose={onClose} />;
    case 'sakura_night':
      return <SakuraNightExperience gift={gift} isPreview={isPreview} onRespond={onRespond} onClose={onClose} />;
    case 'infinite_love':
      return <InfiniteLoveExperience gift={gift} isPreview={isPreview} onRespond={onRespond} onClose={onClose} />;
    case 'memory_archive':
      return <MemoryArchiveExperience gift={gift} isPreview={isPreview} onClose={onClose} />;
    default:
      return <EverTideIslandExperience gift={gift} isPreview={isPreview} onRespond={onRespond} onClose={onClose} />;
  }
}
