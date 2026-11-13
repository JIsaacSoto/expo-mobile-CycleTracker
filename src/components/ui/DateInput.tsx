import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Dialog, HelperText, Icon, Portal, TextInput } from "react-native-paper";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { capitalize, useI18n } from "@/i18n";
import { fromISODate, isISODate, toISODate, type ISODate } from "@/lib/dates";
import { useAppTheme } from "@/theme";
import Button from "./Button";

interface Props {
  label: string;
  value: ISODate | null;
  onChange: (date: ISODate) => void;
  minimumDate?: ISODate;
  maximumDate?: ISODate;
  error?: string | null;
  helper?: string | null;
}

/** Read-only field that opens the platform date picker. Values are ISO dates. */
export default function DateInput({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
  helper,
}: Props) {
  const { t, formatDate } = useI18n();
  const theme = useAppTheme();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ISODate | null>(value);

  const openPicker = () => {
    const current = value ?? maximumDate ?? toISODate(new Date());
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: fromISODate(current),
        mode: "date",
        minimumDate: minimumDate ? fromISODate(minimumDate) : undefined,
        maximumDate: maximumDate ? fromISODate(maximumDate) : undefined,
        onChange: (event, date) => {
          if (event.type === "set" && date) onChange(toISODate(date));
        },
      });
      return;
    }
    setDraft(current);
    setDialogOpen(true);
  };

  const confirmDraft = () => {
    if (draft && isISODate(draft)) onChange(draft);
    setDialogOpen(false);
  };

  return (
    <View>
      <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel={label}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            mode="outlined"
            value={value ? capitalize(formatDate(value, "full")) : ""}
            editable={false}
            error={!!error}
            style={styles.input}
          />
          <View style={styles.icon}>
            <Icon source="calendar" size={24} color={error ? theme.colors.error : theme.colors.onSurfaceVariant} />
          </View>
        </View>
      </Pressable>
      {error ? (
        <HelperText type="error">{error}</HelperText>
      ) : helper ? (
        <HelperText type="info">{helper}</HelperText>
      ) : null}

      <Portal>
        <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Content>
            {Platform.OS === "web" ? (
              React.createElement("input", {
                type: "date",
                value: draft ?? "",
                min: minimumDate,
                max: maximumDate,
                onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
                style: { fontSize: 18, padding: 8, width: "100%", boxSizing: "border-box" },
              })
            ) : (
              <DateTimePicker
                value={fromISODate(draft ?? toISODate(new Date()))}
                mode="date"
                display="inline"
                minimumDate={minimumDate ? fromISODate(minimumDate) : undefined}
                maximumDate={maximumDate ? fromISODate(maximumDate) : undefined}
                onChange={(_, date) => date && setDraft(toISODate(date))}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="text" compact text={t("common.cancel")} onPress={() => setDialogOpen(false)} />
            <Button mode="text" compact text={t("common.confirm")} onPress={confirmDraft} />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { paddingRight: 40 },
  icon: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center", paddingTop: 6 },
});
