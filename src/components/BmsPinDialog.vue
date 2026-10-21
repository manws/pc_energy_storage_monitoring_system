<script setup lang="ts">
import { ref, watch } from 'vue';
import { BMS_FIELDS, DEFAULT_BMS_PINNED } from '@/core/constants';
import type { BmsFieldKey } from '@/core/types';

const props = defineProps<{ modelValue: boolean; pinned: BmsFieldKey[] }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'save', v: BmsFieldKey[]): void;
}>();

const draft = ref<BmsFieldKey[]>([...props.pinned]);
watch(() => props.modelValue, (open) => {
  if (open) draft.value = [...props.pinned];
});

function save() {
  emit('save', [...draft.value]);
  emit('update:modelValue', false);
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="BMS 重点显示配置"
    width="520px"
    append-to-body
    align-center
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="text-[13px] text-slate-400 mb-3">勾选的参数以大号卡片突出显示（建议 4~6 项），其余以列表展示；SOC 始终以环形仪表展示。</p>
    <el-checkbox-group v-model="draft" class="grid grid-cols-2 gap-2">
      <el-checkbox v-for="f in BMS_FIELDS" :key="f.key" :value="f.key" border class="!mr-0 !w-full">
        <i :class="f.icon" :style="{ color: f.color }" class="mr-1" />{{ f.label }}
      </el-checkbox>
    </el-checkbox-group>
    <template #footer>
      <div class="flex justify-between">
        <el-button @click="draft = [...DEFAULT_BMS_PINNED]">恢复默认</el-button>
        <div>
          <el-button @click="emit('update:modelValue', false)">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
