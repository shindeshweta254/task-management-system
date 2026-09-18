import { useCallback, useEffect, useMemo, useState } from "react";

import Layout from "../../components/Layout/Layout";
import "./Inventory.css";

import {
  fetchInventory,
  fetchLowStockInventory,
  fetchInventoryUsageHistory,
  createInventoryItem,
  updateInventoryItem,
  restockInventoryItem,
  useInventoryItem,
  verifyInventoryUsage,
  deactivateInventoryItem,
} from "../../api/inventoryApi";

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch (error) {
    console.error("Invalid localStorage user:", error);
    return {};
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

const emptyForm = {
  itemName: "",
  category: "",
  currentStock: "",
  minimumStock: "",
  unit: "",
  siteCode: "",
  equipmentCondition: "GOOD",
};

function Inventory() {
  const user = getLoggedInUser();

  const role = String(
    user?.roleName || user?.role?.roleName || "EMPLOYEE"
  ).toUpperCase();

  const canManage = [
    "DIRECTOR",
    "SUPERVISOR",
    "MANAGER",
    "OWNER",
    "ADMIN",
    "OWNER/ADMIN",
  ].includes(role);

  const canVerify = canManage;

  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState("inventory");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [quantityItem, setQuantityItem] = useState(null);
  const [quantityMode, setQuantityMode] = useState("");
  const [quantity, setQuantity] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [inventoryData, lowStockData, usageData] =
        await Promise.all([
          fetchInventory(),
          fetchLowStockInventory(),
          fetchInventoryUsageHistory(),
        ]);

      setItems(inventoryData);
      setLowStockItems(lowStockData);
      setUsageHistory(usageData);
    } catch (err) {
      console.error("Inventory load failed:", err);
      setError(
        err?.message || "Unable to load inventory data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalStock = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (Number(item?.currentStock) || 0),
        0
      ),
    [items]
  );

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const openCreateForm = () => {
    clearStatus();
    setEditingItem(null);

    setForm({
      ...emptyForm,
      siteCode: user?.siteCode || "",
    });

    setShowForm(true);
  };

  const openEditForm = (item) => {
    clearStatus();
    setEditingItem(item);

    setForm({
      itemName: item?.itemName || "",
      category: item?.category || "",
      currentStock:
        item?.currentStock === null ||
        item?.currentStock === undefined
          ? ""
          : String(item.currentStock),
      minimumStock:
        item?.minimumStock === null ||
        item?.minimumStock === undefined
          ? ""
          : String(item.minimumStock),
      unit: item?.unit || "",
      siteCode: item?.siteCode || "",
      equipmentCondition:
        item?.equipmentCondition || "GOOD",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveItem = async (event) => {
    event.preventDefault();
    clearStatus();

    if (
      !form.itemName.trim() ||
      !form.category.trim() ||
      !form.unit.trim() ||
      !form.siteCode.trim()
    ) {
      setError(
        "Item Name, Category, Unit and Site are required."
      );
      return;
    }

    const currentStock = Number(form.currentStock);
    const minimumStock = Number(form.minimumStock);

    if (
      !Number.isFinite(currentStock) ||
      currentStock < 0 ||
      !Number.isFinite(minimumStock) ||
      minimumStock < 0
    ) {
      setError(
        "Current Stock and Minimum Stock must be valid non-negative numbers."
      );
      return;
    }

    const payload = {
      itemName: form.itemName.trim(),
      category: form.category.trim(),
      currentStock,
      minimumStock,
      unit: form.unit.trim(),
      siteCode: form.siteCode.trim(),
      equipmentCondition:
        form.equipmentCondition.trim() || "GOOD",
      active:
        editingItem?.active === undefined
          ? true
          : editingItem.active,
    };

    setActionLoading(true);

    try {
      if (editingItem?.id) {
        await updateInventoryItem(editingItem.id, payload);
        setMessage("Inventory item updated successfully.");
      } else {
        await createInventoryItem(payload);
        setMessage("Inventory item created successfully.");
      }

      closeForm();
      await loadData();
    } catch (err) {
      console.error("Inventory save failed:", err);
      setError(
        err?.message || "Unable to save inventory item."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openQuantityAction = (item, mode) => {
    clearStatus();
    setQuantityItem(item);
    setQuantityMode(mode);
    setQuantity("");
  };

  const closeQuantityAction = () => {
    setQuantityItem(null);
    setQuantityMode("");
    setQuantity("");
  };

  const handleQuantitySubmit = async (event) => {
    event.preventDefault();
    clearStatus();

    const numericQuantity = Number(quantity);

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError("Please enter a valid quantity greater than 0.");
      return;
    }

    if (!quantityItem?.id) return;

    setActionLoading(true);

    try {
      if (quantityMode === "restock") {
        await restockInventoryItem(
          quantityItem.id,
          numericQuantity
        );

        setMessage("Stock restocked successfully.");
      } else {
        await useInventoryItem(
          quantityItem.id,
          numericQuantity
        );

        setMessage("Stock usage recorded successfully.");
      }

      closeQuantityAction();
      await loadData();
    } catch (err) {
      console.error("Inventory quantity action failed:", err);
      setError(
        err?.message || "Unable to update inventory stock."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (item) => {
    if (!item?.id) return;

    const confirmed = window.confirm(
      `Deactivate "${item.itemName}"?`
    );

    if (!confirmed) return;

    clearStatus();
    setActionLoading(true);

    try {
      await deactivateInventoryItem(item.id);
      setMessage("Inventory item deactivated successfully.");
      await loadData();
    } catch (err) {
      console.error("Inventory deactivate failed:", err);
      setError(
        err?.message || "Unable to deactivate inventory item."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyUsage = async (usage) => {
    if (!usage?.id || usage?.supervisorVerified) return;

    clearStatus();
    setActionLoading(true);

    try {
      await verifyInventoryUsage(usage.id);
      setMessage("Inventory usage verified successfully.");
      await loadData();
    } catch (err) {
      console.error("Inventory verification failed:", err);
      setError(
        err?.message || "Unable to verify inventory usage."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderInventoryTable = (data) => (
    <div className="inv-table-wrap">
      <table className="inv-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Minimum Stock</th>
            <th>Unit</th>
            <th>Site</th>
            <th>Last Restocked</th>
            <th>Equipment Condition</th>
            <th>Stock Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="10" className="inv-empty">
                No inventory items found.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
                <td className="inv-item-name">
                  {item.itemName || "-"}
                </td>

                <td>{item.category || "-"}</td>

                <td>
                  {item.currentStock ?? 0}
                </td>

                <td>
                  {item.minimumStock ?? 0}
                </td>

                <td>{item.unit || "-"}</td>

                <td>{item.siteCode || "-"}</td>

                <td>
                  {formatDateTime(item.lastRestockedAt)}
                </td>

                <td>
                  <span className="inv-condition">
                    {item.equipmentCondition || "-"}
                  </span>
                </td>

                <td>
                  {item.restockRequired ? (
                    <span className="inv-badge inv-low">
                      Restock Required
                    </span>
                  ) : (
                    <span className="inv-badge inv-ok">
                      In Stock
                    </span>
                  )}
                </td>

                <td>
                  <div className="inv-actions">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="inv-btn inv-use-btn"
                          disabled={actionLoading}
                          onClick={() =>
                            openQuantityAction(item, "use")
                          }
                        >
                          Use
                        </button>

                        <button
                          type="button"
                          className="inv-btn inv-restock-btn"
                          disabled={actionLoading}
                          onClick={() =>
                            openQuantityAction(
                              item,
                              "restock"
                            )
                          }
                        >
                          Restock
                        </button>

                        <button
                          type="button"
                          className="inv-btn inv-edit-btn"
                          disabled={actionLoading}
                          onClick={() =>
                            openEditForm(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="inv-btn inv-delete-btn"
                          disabled={actionLoading}
                          onClick={() =>
                            handleDeactivate(item)
                          }
                        >
                          Deactivate
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout title="Inventory">
      <div className="inv-page">
        <div className="inv-header">
          <div>
            <h2>Inventory & Supply Control</h2>
            <p>
              Check stock, record usage and manage restocking.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              className="inv-primary-btn"
              onClick={openCreateForm}
            >
              + Add Inventory Item
            </button>
          )}
        </div>

        <div className="inv-summary-grid">
          <div className="inv-summary-card">
            <span>Total Items</span>
            <strong>{items.length}</strong>
          </div>

          <div className="inv-summary-card">
            <span>Low Stock Items</span>
            <strong>{lowStockItems.length}</strong>
          </div>

          <div className="inv-summary-card">
            <span>Total Current Stock</span>
            <strong>{totalStock}</strong>
          </div>

          <div className="inv-summary-card">
            <span>Usage Records</span>
            <strong>{usageHistory.length}</strong>
          </div>
        </div>

        {error && (
          <div className="inv-alert inv-error">
            {error}
          </div>
        )}

        {message && (
          <div className="inv-alert inv-success">
            {message}
          </div>
        )}

        <div className="inv-tabs">
          <button
            type="button"
            className={
              activeTab === "inventory" ? "active" : ""
            }
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </button>

          <button
            type="button"
            className={
              activeTab === "low-stock" ? "active" : ""
            }
            onClick={() => setActiveTab("low-stock")}
          >
            Low Stock ({lowStockItems.length})
          </button>

          <button
            type="button"
            className={
              activeTab === "usage" ? "active" : ""
            }
            onClick={() => setActiveTab("usage")}
          >
            Usage History
          </button>
        </div>

        <section className="inv-card">
          {loading ? (
            <div className="inv-loading">
              Loading inventory...
            </div>
          ) : activeTab === "inventory" ? (
            renderInventoryTable(items)
          ) : activeTab === "low-stock" ? (
            renderInventoryTable(lowStockItems)
          ) : (
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Used Quantity</th>
                    <th>Site</th>
                    <th>Used By</th>
                    <th>Employee ID</th>
                    <th>Used At</th>
                    <th>Verification</th>
                    <th>Verified By</th>
                    {canVerify && <th>Action</th>}
                  </tr>
                </thead>

                <tbody>
                  {usageHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canVerify ? 9 : 8}
                        className="inv-empty"
                      >
                        No inventory usage records found.
                      </td>
                    </tr>
                  ) : (
                    usageHistory.map((usage) => (
                      <tr key={usage.id}>
                        <td>{usage.itemName || "-"}</td>

                        <td>
                          {usage.usedQuantity ?? 0}{" "}
                          {usage.unit || ""}
                        </td>

                        <td>{usage.siteCode || "-"}</td>

                        <td>
                          {usage.usedByName || "-"}
                        </td>

                        <td>
                          {usage.usedByEmployeeId || "-"}
                        </td>

                        <td>
                          {formatDateTime(usage.usedAt)}
                        </td>

                        <td>
                          {usage.supervisorVerified ? (
                            <span className="inv-badge inv-ok">
                              Verified
                            </span>
                          ) : (
                            <span className="inv-badge inv-pending">
                              Pending
                            </span>
                          )}
                        </td>

                        <td>
                          {usage.verifiedByName || "-"}
                          {usage.verifiedAt && (
                            <small className="inv-verified-time">
                              {formatDateTime(
                                usage.verifiedAt
                              )}
                            </small>
                          )}
                        </td>

                        {canVerify && (
                          <td>
                            {!usage.supervisorVerified ? (
                              <button
                                type="button"
                                className="inv-btn inv-verify-btn"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleVerifyUsage(usage)
                                }
                              >
                                Verify
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showForm && (
          <div className="inv-modal-backdrop">
            <div className="inv-modal">
              <div className="inv-modal-header">
                <h3>
                  {editingItem
                    ? "Edit Inventory Item"
                    : "Add Inventory Item"}
                </h3>

                <button
                  type="button"
                  onClick={closeForm}
                  className="inv-close-btn"
                >
                  ×
                </button>
              </div>

              <form
                className="inv-form"
                onSubmit={handleSaveItem}
              >
                <label>
                  Item Name
                  <input
                    name="itemName"
                    value={form.itemName}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Category
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <div className="inv-form-row">
                  <label>
                    Current Stock
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name="currentStock"
                      value={form.currentStock}
                      onChange={handleFormChange}
                      required
                    />
                  </label>

                  <label>
                    Minimum Stock
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name="minimumStock"
                      value={form.minimumStock}
                      onChange={handleFormChange}
                      required
                    />
                  </label>
                </div>

                <div className="inv-form-row">
                  <label>
                    Unit
                    <input
                      name="unit"
                      value={form.unit}
                      onChange={handleFormChange}
                      placeholder="Litre, Kg, Piece..."
                      required
                    />
                  </label>

                  <label>
                    Site
                    <input
                      name="siteCode"
                      value={form.siteCode}
                      onChange={handleFormChange}
                      required
                    />
                  </label>
                </div>

                <label>
                  Equipment Condition
                  <select
                    name="equipmentCondition"
                    value={form.equipmentCondition}
                    onChange={handleFormChange}
                  >
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="NEEDS_REPAIR">
                      NEEDS REPAIR
                    </option>
                    <option value="DAMAGED">
                      DAMAGED
                    </option>
                  </select>
                </label>

                <div className="inv-form-actions">
                  <button
                    type="button"
                    className="inv-secondary-btn"
                    onClick={closeForm}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inv-primary-btn"
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Saving..."
                      : editingItem
                      ? "Update Item"
                      : "Create Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {quantityItem && (
          <div className="inv-modal-backdrop">
            <div className="inv-modal inv-small-modal">
              <div className="inv-modal-header">
                <h3>
                  {quantityMode === "restock"
                    ? "Restock Item"
                    : "Record Usage"}
                </h3>

                <button
                  type="button"
                  onClick={closeQuantityAction}
                  className="inv-close-btn"
                >
                  ×
                </button>
              </div>

              <form
                className="inv-form"
                onSubmit={handleQuantitySubmit}
              >
                <p className="inv-selected-item">
                  <strong>
                    {quantityItem.itemName}
                  </strong>
                  <br />
                  Current Stock:{" "}
                  {quantityItem.currentStock ?? 0}{" "}
                  {quantityItem.unit || ""}
                </p>

                <label>
                  Quantity
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    required
                    autoFocus
                  />
                </label>

                <div className="inv-form-actions">
                  <button
                    type="button"
                    className="inv-secondary-btn"
                    onClick={closeQuantityAction}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inv-primary-btn"
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Please wait..."
                      : quantityMode === "restock"
                      ? "Restock"
                      : "Record Usage"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Inventory;