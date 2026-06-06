<template>
  <label class="block">
    <span class="mb-2 block text-sm font-semibold text-[#202020]">{{ label }}</span>
    <VueTelInput
      ref="phoneInputRef"
      :model-value="modelValue"
      :auto-default-country="false"
      :default-country="country"
      :dropdown-options="dropdownOptions"
      :input-options="inputOptions"
      :only-countries="lockCountry ? [country] : []"
      :preferred-countries="lockCountry ? [country] : ['LB', 'AE', 'SA', 'QA', 'KW', 'US']"
      :valid-characters-only="true"
      mode="international"
      dir="ltr"
      style-classes="portal-phone-input"
      @country-changed="countryChanged"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </label>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  defaultCountry: { type: String, default: 'LB' },
  searchPlaceholder: { type: String, default: 'Search country or code' },
  placeholder: { type: String, default: 'Phone number' },
  lockCountry: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:country'])
const country = ref(props.defaultCountry.toUpperCase())
const phoneInputRef = ref(null)

const dropdownOptions = computed(() => ({
  showDialCodeInList: true,
  showDialCodeInSelection: true,
  showFlags: true,
  showSearchBox: !props.lockCountry,
  searchBoxPlaceholder: props.searchPlaceholder,
  disabled: props.lockCountry,
}))

const inputOptions = computed(() => ({
  autocomplete: 'tel',
  inputmode: 'tel',
  maxlength: 24,
  placeholder: props.placeholder,
  type: 'tel',
}))

watch(
  () => props.defaultCountry,
  (value) => {
    if (value) country.value = value.toUpperCase()
  },
)

function countryChanged(nextCountry) {
  if (props.lockCountry) {
    country.value = props.defaultCountry.toUpperCase()
    return
  }
  const iso2 = nextCountry?.iso2?.toUpperCase()
  if (!iso2) return
  country.value = iso2
  emit('update:country', iso2)
}

function focus() {
  phoneInputRef.value?.$el?.querySelector('input[type="tel"]')?.focus()
}

defineExpose({ focus })
</script>
