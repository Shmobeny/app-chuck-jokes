<script setup>
  import { computed, inject } from 'vue';
  import useFetch from '../hooks/useFetch';
  import Categories from './Categories.vue';
  import Button from './Button.vue';

  const props = defineProps(["url", "activeCategory", "searchQuery", "isShared"]);
  const emits = defineEmits(["toggleBookmarks"]);

  const { bookmarks, editBookmarks } = inject("bookmarks");
  const { data, error } = await useFetch(props.url, 1000);

  const isInBookmarks = computed(() => {
    return error ? false : bookmarks.value.IDs.indexOf(data.id) > -1;
  });

  function editBookmarksWrapper() {
    if (!isInBookmarks.value) editBookmarks("add", data);
  }

</script>

<template>

  <p :class="isShared ? 'joke joke--shared' : 'joke'" v-if="data">{{ data.value }}</p>
  
  <div v-if="error">
    <p v-if="error.type === 'QueryLengthError'" :class="isShared ? 'joke joke--shared' : 'joke'">Chuck Norris once says: "<span style="color:red">search query must be in a range from 3 to 120 symbols</span>, or you can get a fuck off".</p>
    <p v-if="error.type === 'SearchError'" :class="isShared ? 'joke joke--shared' : 'joke'">Only Chuck Norris knows jokes about <span style="color:red">{{ searchQuery }}</span>. You are not allowed!</p>
    <p v-if="error.type === 'FetchError'" :class="isShared ? 'joke joke--shared' : 'joke'">Only Chuck Norris cool enough to hear this joke about <span style="color:red">error, during fetching API</span>. But you can try to find another one.</p>
    <p v-if="error.type === 'ConnetionError'" :class="isShared ? 'joke joke--shared' : 'joke'">Only Chuck Norris cool enough to fetch jokes with <span style="color:red">lost internet connection</span>, but not you.</p>
  </div>

  <div class="joke__buttons" v-if="!isShared">
    <Button class="joke__button" @click="editBookmarksWrapper" :disabled="(isInBookmarks === true || error !== null)">add to</Button>
    <Button class="joke__button" @click="$emit('toggleBookmarks')" :disabled="(bookmarks.IDs.length === 0)">bookmarks</Button>
  </div>

  <Categories v-if="!isShared" />

</template>

<style scoped>
  .joke {
    width: 100%;
    padding: 5px;
    font-size: 40px;
    text-align: center;
    border: 2px solid orange;
    border-radius: 10px 10px 0 10px;
    background-color: rgba(255, 166, 0, 0.5);
    text-shadow: 1px 1px 1px black;
  }

  .joke--shared {
    margin-bottom: 40px;
    border-radius: 10px;
  }

  .joke__buttons {
    display: flex;
    justify-content: end;
    width: 100%;
    margin-bottom: 13px;
  }

  .joke__button {
    font-size: 20px;
    /* background-color: orange; */
    border: 2px solid orange;
    border-top: none;
  }

  .joke__button:first-child {
    border-right: none;
    border-radius: 0 0 0 10px;
  }

  .joke__button:last-child {
    border-left: none;
    border-radius: 0 0 10px 0;
  }
</style>