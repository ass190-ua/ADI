<template>
  <!-- The root component simply renders the current route. -->
  <router-view />
</template>

<script setup>
// No script needed for the root component. All logic is contained in child views.
</script>

<style>
/* Reset any default margins/padding and let imported CSS control styling. */
body {
  margin: 0;
  padding: 0;
}
</style>