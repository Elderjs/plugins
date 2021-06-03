<script>
  export let settings, helpers;

  const routes = Object.keys(helpers.permalinks).filter(
    (a) => !(a.toLowerCase().includes('plugin') && a.toLowerCase().includes('random')),
  );

</script>

<div class="inner">
  <h1>Random Routes</h1>
  <p>To preview a random page from any of your routes. Click on the route name below.</p>
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
