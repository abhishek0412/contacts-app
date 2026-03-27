import { showNotification } from "../notificationSlice";

export const onAddContactSuccess = (dispatch, data) => {
  const name = data.name || `${data.first_name} ${data.last_name}`.trim();
  dispatch(
    showNotification({ message: `"${name}" has been added!`, type: "success" }),
  );
};

export const onAddContactError = (dispatch) => {
  dispatch(
    showNotification({ message: "Failed to add contact.", type: "error" }),
  );
};

export const onUpdateContactSuccess = (dispatch, data) => {
  const name = data.name || `${data.first_name} ${data.last_name}`.trim();
  dispatch(
    showNotification({
      message: `"${name}" has been updated.`,
      type: "success",
    }),
  );
};

export const onUpdateContactError = (dispatch) => {
  dispatch(
    showNotification({ message: "Failed to update contact.", type: "error" }),
  );
};

export const onDeleteContactSuccess = (dispatch, contactName) => {
  dispatch(
    showNotification({
      message: `"${contactName || "Contact"}" has been removed.`,
      type: "info",
    }),
  );
};

export const onDeleteContactError = (dispatch) => {
  dispatch(
    showNotification({ message: "Failed to delete contact.", type: "error" }),
  );
};
