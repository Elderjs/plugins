<script>
  export let settings, helpers;

  const routes = Object.keys(helpers.permalinks).filter(
    (a) => !(a.toLowerCase().includes('plugin') && a.toLowerCase().includes('random')),
  );
</script>

<div class="container">
  {#if routes.length > 0}
    <ul>
      {#each routes as route}
        <li><a href="{settings.prefix}/random/{route}/">{route}</a></li>
      {/each}
    </ul>
  {:else}
    No routes registered to provide links to
  {/if}
</div>
