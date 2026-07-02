import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance } from 'tippy.js';
import { MentionList, MentionListRef } from './MentionList';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

// Global reference that the writing view can mutate to sync characters dynamically
export const mentionSuggestions = {
  characters: ['Elena', 'Jax', 'Captain Vance', 'Lyra', 'Dr. Aris', 'Zephyr']
};

const suggestion = {
  items: ({ query }: { query: string }) => {
    return mentionSuggestions.characters.filter(item => 
      item.toLowerCase().startsWith(query.toLowerCase())
    ).slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer;
    let popup: Instance[];

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as (() => DOMRect) | undefined,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as (() => DOMRect) | undefined,
        });
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          if (popup && popup[0]) {
            popup[0].hide();
          }
          return true;
        }

        const ref = component.ref as MentionListRef | null;
        if (ref && ref.onKeyDown) {
          return ref.onKeyDown({ event: props.event });
        }

        return false;
      },

      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};

export default suggestion;