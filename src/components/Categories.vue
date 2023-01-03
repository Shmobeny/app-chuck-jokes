<script setup>
  import { ref, inject } from 'vue';
  import useFetch from '../hooks/useFetch';
  import Button from './Button.vue';
  import Search from './Search.vue';

  const { categories, updateCategories } = inject("categories");
  const { categoriesIsFetched, updateCategoriesIsFetched } = inject("categoriesIsFetched");
  const { activeCategory, updateActiveCategory } = inject("activeCategory");
  const switcher = ref(0);

  await getCategories();

  async function getCategories() {
    if (categoriesIsFetched.value) return;

    let { data, error } = await useFetch("https://api.chucknorris.io/jokes/categories", 0);
 
    if (error) return;

    updateCategoriesIsFetched();
    updateCategories(categories.value.concat(data));
  }
  
  function changeActiveCat(newValue) {
    let proxyCategories = [...categories.value];
    proxyCategories.splice(proxyCategories.indexOf(newValue), 1, activeCategory.value);
    
    updateCategories(proxyCategories);
    updateActiveCategory(newValue);
    
    switcher.value = switcher.value === 0 ? 1 : 0;
  }

</script>

<template>

  <div class="cats">
    <div class="cats__header">
      <span class="cats__about">Joke about:</span>
      <div class="cats__sub-container">
        <Transition name="slide-up" mode="out-in">
          <span v-if="(switcher === 0 && activeCategory !== 'search')" class="cats__cat--active">{{ activeCategory }}</span>
          <span v-else-if="(switcher === 1 && activeCategory !== 'search')" class="cats__cat--active">{{ activeCategory }}</span>
          <div v-else-if="(activeCategory === 'search')" class="cats__cat--active">
            <Search />
          </div>
      </Transition>
      </div>
    </div>
    <ul class="cats__container">
      <TransitionGroup name="tags-insert">
        <li
          v-for="category in categories"
          :key="category"
        >
          <Button
            @click="changeActiveCat(category)"
            :class='[category === "random" ? "cats__cat cats__cat--random" : category === "search" ? "cats__cat cats__cat--search" : "cats__cat"]'
          >
            {{ category }}
          </Button>
        </li>
      </TransitionGroup>
    </ul>
  </div>

</template>

<style scoped>
  .cats {
    position: relative;
    width: 100%;
    margin-bottom: 35px;
  }
  .cats__header {
    display: flex;
    flex-wrap: wrap;
    height: 46px;
    margin-bottom: 5px;
  }
  .cats__about {
    text-decoration: underline;
  }
  .cats__sub-container {
    position: relative;
    flex-grow: 1;
    min-height: 46px;
  }
  .cats__container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .cats__cat {
    margin: 5px;
    padding: 5px;
    font-size: 25px;
  }
  .cats__cat--active {
    position: relative;
    padding-left: 10px;
    text-transform: uppercase;
    width: 100%;
  }
  .cats__cat--random {
    background-color: blue;
  }
  .cats__cat--search {
    background-color: red;
  }
  .cats__cat--random:hover,
  .cats__cat--search:hover {
    color: black;
    background-color: azure;
  }

  .slide-up-enter-active,
  .slide-up-leave-active {
    position: absolute;
    top: 0%;
    left: 0%;
    transition: all 100ms ease-out;
  }
  .slide-up-enter-from {
    opacity: 0;
    transform: translateY(30px);
  }
  .slide-up-leave-to {
    opacity: 0;
    transform: translateY(-30px);
  }
  .tags-insert-move {
    transition: all 100ms ease;
  }
  .tags-insert-leave-active {
    position: absolute;
  }
  .tags-insert-leave-to,
  .tags-insert-leave-from {
    opacity: 0;
  }

  @media screen and (max-width: 357px) {
    .cats__header{
      flex-direction: column;
      align-items: center;
      height: auto;
    }

    .cats__sub-container {
      width: 100%;
      text-align: center;
    }
  }
</style>