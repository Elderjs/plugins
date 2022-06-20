const config = {
    referenceListLabel: 'References: ',
};
const plugin = {
    name: '@elderjs/plugin-references',
    minimumElderjsVersion: '1.7.5',
    description: 'Adds {{ref}} and {{referenceList}} shortcodes to Elder.js allowing you to add wikipedia style references to your content.',
    init: (plugin) => {
        // used to store the data in the plugin's closure so it is persisted between loads
        const internal = {
            references: {},
            config: plugin.config,
        };
        return { ...plugin, internal };
    },
    config,
    shortcodes: [
        {
            shortcode: 'ref',
            run: ({ content, request, plugin }) => {
                const internal = plugin.internal;
                const count = internal.references[request.permalink].length + 1;
                internal.references[request.permalink].push(`
        <li id='cite_note-${count}'>
        <cite>${content}</cite>
        <a href='#cite_ref-${count}' class='cite-ref-backlink' aria-label='Jump up to reference' title='Jump up to reference'>^</a>
      </li>`);
                return `<sup id='cite_ref-${count}' class='reference'><a href='#cite_note-${count}'>[${count}]</a></sup>`;
            },
        },
        {
            shortcode: 'referenceList',
            run: ({ props, request, plugin }) => {
                const internal = plugin.internal;
                if (internal.references[request.permalink] && internal.references[request.permalink].length > 0) {
                    return `<div class="references"><h4>${props.label || internal.config.referenceListLabel}</h4><ol>${internal.references[request.permalink].join('')}</ol></div>`;
                }
            },
        },
    ],
    hooks: [
        {
            hook: 'request',
            name: 'resetReferencesOnRequest',
            description: `If references aren't reset, the plugin will collect references between page loads.`,
            run: async ({ request, plugin }) => {
                const internal = plugin.internal;
                //stored as such to prevent possible page.ts leakage. Unlikely but could happen.
                internal.references[request.permalink] = [];
                return { plugin };
            },
        },
    ],
};
export default plugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsTUFBTSxNQUFNLEdBQUc7SUFDYixrQkFBa0IsRUFBRSxjQUFjO0NBQ25DLENBQUM7QUFFRixNQUFNLE1BQU0sR0FBa0I7SUFDNUIsSUFBSSxFQUFFLDRCQUE0QjtJQUNsQyxxQkFBcUIsRUFBRSxPQUFPO0lBQzlCLFdBQVcsRUFDVCwySEFBMkg7SUFDN0gsSUFBSSxFQUFFLENBQUMsTUFBYyxFQUFjLEVBQUU7UUFDbkMsa0ZBQWtGO1FBQ2xGLE1BQU0sUUFBUSxHQUEwQjtZQUN0QyxVQUFVLEVBQUUsRUFBRTtZQUNkLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtTQUN0QixDQUFDO1FBQ0YsT0FBTyxFQUFFLEdBQUcsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFDRCxNQUFNO0lBQ04sVUFBVSxFQUFFO1FBQ1Y7WUFDRSxTQUFTLEVBQUUsS0FBSztZQUNoQixHQUFHLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQkFDcEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQWlDLENBQUM7Z0JBQzFELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ2hFLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQzs0QkFDeEIsS0FBSztnQkFDakIsT0FBTzs2QkFDTSxLQUFLO1lBQ3RCLENBQUMsQ0FBQztnQkFDTixPQUFPLHFCQUFxQixLQUFLLDJDQUEyQyxLQUFLLE1BQU0sS0FBSyxhQUFhLENBQUM7WUFDNUcsQ0FBQztTQUNGO1FBQ0Q7WUFDRSxTQUFTLEVBQUUsZUFBZTtZQUMxQixHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQkFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQWlDLENBQUM7Z0JBQzFELElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDL0YsT0FBTywrQkFDTCxLQUFLLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsa0JBQ2pDLFlBQVksUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUM7aUJBQzFFO1lBQ0gsQ0FBQztTQUNGO0tBQ0Y7SUFDRCxLQUFLLEVBQUU7UUFDTDtZQUNFLElBQUksRUFBRSxTQUFTO1lBQ2YsSUFBSSxFQUFFLDBCQUEwQjtZQUNoQyxXQUFXLEVBQUUsb0ZBQW9GO1lBQ2pHLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQkFDakMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQWlDLENBQUM7Z0JBQzFELGdGQUFnRjtnQkFDaEYsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM1QyxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDcEIsQ0FBQztTQUNGO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsZUFBZSxNQUFNLENBQUMifQ==