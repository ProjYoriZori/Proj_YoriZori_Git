import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Card, Chip, Field, IconButton, PrimaryButton, SectionHeader } from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import { colors, globalStyles } from "../theme";
import { calculateDRI } from "../utils/nutrition";

const goals = ["다이어트", "유지", "벌크업"];
const activities = ["낮음", "보통", "높음"];

const goalMap = { DIET: "다이어트", MAINTAIN: "유지", BULK: "벌크업" };
const activityMap = { LOW: "낮음", NORMAL: "보통", HIGH: "높음" };
const genderMap = { MALE: "남성", FEMALE: "여성" };

function toDisplay(value, map) {
  return map[value] || value || "-";
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrap}>
        <MaterialCommunityIcons name={icon} size={16} color={colors.muted} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

function ProfileView({ profile }) {
  return (
    <View>
      <InfoRow icon="account-outline" label="성별" value={toDisplay(profile?.gender, genderMap)} />
      <InfoRow icon="calendar-outline" label="나이" value={profile?.age ? `${profile.age}세` : null} />
      <InfoRow icon="human-male-height" label="키" value={profile?.height ? `${profile.height}cm` : null} />
      <InfoRow icon="weight-kilogram" label="체중" value={profile?.weight ? `${profile.weight}kg` : null} />
      <InfoRow icon="target" label="목표" value={toDisplay(profile?.goal, goalMap)} />
      <InfoRow icon="run" label="활동량" value={toDisplay(profile?.activityLevel, activityMap)} />
    </View>
  );
}

function ProfileEditForm({ profile, onSave, onCancel }) {
  const [form, setForm] = useState({
    nickname: profile?.nickname || "",
    email: profile?.email || "",
    gender: toDisplay(profile?.gender, genderMap) || "남성",
    age: profile?.age ? String(profile.age) : "",
    height: profile?.height ? String(profile.height) : "",
    weight: profile?.weight ? String(profile.weight) : "",
    goal: toDisplay(profile?.goal, goalMap) || "유지",
    activityLevel: toDisplay(profile?.activityLevel, activityMap) || "보통",
  });
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((c) => ({ ...c, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      ...form,
      age: Number(form.age) || "",
      height: Number(form.height) || "",
      weight: Number(form.weight) || "",
    });
    setSaving(false);
  };

  return (
    <View style={styles.formGap}>
      <Field value={form.nickname} onChangeText={(v) => set("nickname", v)} placeholder="닉네임" />
      <Field value={form.email} onChangeText={(v) => set("email", v)} placeholder="이메일" keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>성별</Text>
      <View style={styles.chipRow}>
        {["남성", "여성"].map((g) => (
          <Chip key={g} label={g} active={form.gender === g} onPress={() => set("gender", g)} icon="account-outline" />
        ))}
      </View>

      <View style={styles.formRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>나이</Text>
          <Field value={form.age} onChangeText={(v) => set("age", v)} placeholder="세" keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>키</Text>
          <Field value={form.height} onChangeText={(v) => set("height", v)} placeholder="cm" keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>체중</Text>
          <Field value={form.weight} onChangeText={(v) => set("weight", v)} placeholder="kg" keyboardType="decimal-pad" />
        </View>
      </View>

      <Text style={styles.label}>목표</Text>
      <View style={styles.chipRow}>
        {goals.map((g) => (
          <Chip key={g} label={g} active={form.goal === g} onPress={() => set("goal", g)} icon="target" />
        ))}
      </View>

      <Text style={styles.label}>활동량</Text>
      <View style={styles.chipRow}>
        {activities.map((a) => (
          <Chip key={a} label={a} active={form.activityLevel === a} onPress={() => set("activityLevel", a)} icon="run" />
        ))}
      </View>

      <View style={styles.formRow}>
        <PrimaryButton label={saving ? "저장 중..." : "저장"} icon="content-save-outline" onPress={handleSave} disabled={saving} style={{ flex: 1 }} />
        <PrimaryButton label="취소" tone="secondary" onPress={onCancel} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export default function MyPageScreen() {
  const { profile, saveProfile } = useAppData();
  const [editing, setEditing] = useState(false);
  const dri = useMemo(() => calculateDRI(profile), [profile]);

  const handleSave = async (data) => {
    await saveProfile(data);
    setEditing(false);
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={globalStyles.content} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={34} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.nickname || "사용자"}</Text>
            <Text style={globalStyles.subtitle}>{profile?.email || "프로필을 설정해 주세요"}</Text>
          </View>
          <IconButton
            icon={editing ? "close" : "pencil-outline"}
            onPress={() => setEditing((e) => !e)}
            backgroundColor={editing ? "#fff0ef" : colors.surfaceAlt}
            color={editing ? colors.danger : colors.text}
          />
        </View>

        {/* 목표 칼로리 */}
        {dri ? (
          <View style={styles.calorieBox}>
            <Text style={styles.calorieLabel}>목표 칼로리</Text>
            <View style={styles.calorieRow}>
              <Text style={styles.calorieValue}>{dri.calories}</Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>
          </View>
        ) : null}

        {/* 프로필 카드 */}
        <Card>
          <SectionHeader
            title={editing ? "프로필 수정" : "내 정보"}
            icon={editing ? "account-edit-outline" : "account-outline"}
          />
          {editing ? (
            <ProfileEditForm
              key={profile?.id}
              profile={profile}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <ProfileView profile={profile} />
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
    paddingBottom: 16,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  calorieBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 20,
  },
  calorieLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  calorieValue: {
    color: colors.primaryDark,
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 52,
  },
  calorieUnit: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "800",
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "800",
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  formGap: {
    gap: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  fieldLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 4,
  },
  label: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "900",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
