import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import styles from "./AdminEdit.module.css"; // Import modular CSS

const AdminEdit = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [productData, setProductData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editFields, setEditFields] = useState({});
    const [tagLibrary, setTagLibrary] = useState([]);
    const [parameters, setParameters] = useState([]);
    const [creatorName, setCreatorName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [reportDetails, setReportDetails] = useState({});
    const [comments, setComments] = useState([]);

    // Fetch product details
    const fetchProductDetails = async () => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        try {
            const response = await handleProductEntryRequest({ action: "fetchProducts" });
            const product = response.data.data.find((p) => p.id === productId);
            if (product) {
                setProductData(product);
                setEditFields({
                    productName: product.productName,
                    description: product.description,
                    tagList: product.tagList,
                    subtagList: product.subtagList,
                });

                fetchParameters(product.id);
                fetchCreatorName(product.creator);
                fetchReports(productId); // 保留并处理举报逻辑
                fetchComments(productId); // 保留评论逻辑
            } else {
                setErrorMessage("Product not found.");
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
            setErrorMessage("Failed to fetch product details.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch tag library
    const fetchTagLibrary = async () => {
        const handleTagLibraryRequest = httpsCallable(functions, "handleTagLibraryRequest");
        try {
            const response = await handleTagLibraryRequest({ action: "getTagLibrary" });
            setTagLibrary(response.data.tagList);
        } catch (error) {
            console.error("Error fetching tag library:", error);
        }
    };

    // Fetch parameters
    const fetchParameters = async (productId) => {
        const handleParameterRequest = httpsCallable(functions, "handleParameterRequest");
        try {
            const response = await handleParameterRequest({ action: "getParameters", productId });
            setParameters(response.data.parameters || []);
        } catch (error) {
            console.error("Error fetching parameters:", error);
        }
    };

    // Fetch creator name
    const fetchCreatorName = async (creatorId) => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        try {
            const response = await handleUserRequest({ action: "getUserData", uidNum: creatorId });
            setCreatorName(response.data.data.username);
        } catch (error) {
            console.error("Error fetching creator name:", error);
        }
    };

    // Process and group reports by reason
    const processReports = (reportList) => {
        const reportDetails = {};
        reportList.forEach((report) => {
            const { reportReason, reporter } = report;
            if (!reportDetails[reportReason]) {
                reportDetails[reportReason] = {
                    amount: 0,
                    reporters: []
                };
            }
            reportDetails[reportReason].amount += 1;
            reportDetails[reportReason].reporters.push({ id: reporter, username: null });
        });
        return reportDetails;
    };

    // Fetch usernames for reporters
    const fetchUsernames = async (reportDetails) => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        const userIds = new Set();
        Object.values(reportDetails).forEach((details) => {
            details.reporters.forEach((reporter) => {
                userIds.add(reporter.id);
            });
        });

        const idToUsername = {};
        const fetchPromises = [...userIds].map(async (id) => {
            try {
                const response = await handleUserRequest({ action: "getUserData", uidNum: id });
                if (response.data.success) {
                    idToUsername[id] = response.data.data.username;
                } else {
                    idToUsername[id] = "Unknown User";
                }
            } catch {
                idToUsername[id] = "Unknown User";
            }
        });

        await Promise.all(fetchPromises);
        Object.values(reportDetails).forEach((details) => {
            details.reporters.forEach((reporter) => {
                if (idToUsername[reporter.id]) {
                    reporter.username = idToUsername[reporter.id];
                }
            });
        });

        return reportDetails;
    };

    // Fetch report details
    const fetchReports = async (productId) => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        try {
            const response = await handleProductEntryRequest({ action: "getReports", productId });
            if (response.data.success) {
                const processedReports = processReports(response.data.reportList || []);
                const updatedReports = await fetchUsernames(processedReports);
                setReportDetails(updatedReports);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    };

    // Fetch comments
    const fetchComments = async (productId) => {
        const handleCommentRequest = httpsCallable(functions, "handleCommentRequest");
        try {
            const response = await handleCommentRequest({ action: "getCommentsWithReplies", productId });
            if (response.data.success) {
                setComments(response.data.comments || []);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    // Delete comment
    const deleteComment = async (commentId) => {
        const handleCommentRequest = httpsCallable(functions, "handleCommentRequest");
        try {
            const response = await handleCommentRequest({
                action: "deleteCommentWithReplies",
                productId,
                commentId,
            });
            if (response.data.success) {
                setComments((prev) => prev.filter((comment) => comment.commentId !== commentId));
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    // Render report details
    const renderReports = () => {
        if (!reportDetails || Object.keys(reportDetails).length === 0) {
            return <p>No reports found for this product.</p>;
        }

        return Object.keys(reportDetails).map((reason) => (
            <div key={reason} className={styles.reportSection}>
                <h3>{reason}</h3>
                <p>Amount: {reportDetails[reason].amount}</p>
                <ul>
                    {reportDetails[reason].reporters.map((reporter, index) => (
                        <li key={index}>
                            {reporter.id} - {reporter.username || "Loading..."}
                        </li>
                    ))}
                </ul>
            </div>
        ));
    };

    // Render comments and replies
    const renderComments = () => {
        return comments.map((comment) => (
            <div key={comment.commentId} className={styles.commentSection}>
                <div className={styles.comment}>
                    <p><strong>{comment.user.username}</strong>: {comment.content}</p>
                    <button
                        onClick={() => deleteComment(comment.commentId)}
                        className={`${styles.button} ${styles.deleteButton}`}
                    >
                        Delete
                    </button>
                </div>
                {comment.replies && (
                    <div className={styles.replies}>
                        {comment.replies.map((reply) => (
                            <div key={reply.commentId} className={styles.reply}>
                                <p>
                                    <strong>{reply.user.username}</strong>: {reply.content}
                                </p>
                                <button
                                    onClick={() => deleteComment(reply.commentId)}
                                    className={`${styles.button} ${styles.deleteButton}`}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ));
    };

    // Handle input changes
    const handleInputChange = (field, value) => {
        setEditFields((prev) => ({ ...prev, [field]: value }));
    };

    // Update product
    const handleUpdateProduct = async () => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        try {
            const response = await handleProductEntryRequest({
                action: "edit",
                productId,
                updates: { ...editFields, parameters },
            });
            if (response.data.success) {
                setSuccessMessage("Product updated successfully!");
            } else {
                setErrorMessage(`Error: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error updating product:", error);
        }
    };

    useEffect(() => {
        fetchProductDetails();
        fetchTagLibrary();
    }, [productId]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Edit Product</h1>
            {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
            {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

            {productData && (
                <>
                    <div className={styles.section}>
                        <label className={styles.label}>Title</label>
                        <input
                            type="text"
                            value={editFields.productName || ""}
                            onChange={(e) => handleInputChange("productName", e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            value={editFields.description || ""}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Tags</label>
                        <select
                            value={editFields.tagList || ""}
                            onChange={(e) => handleInputChange("tagList", e.target.value)}
                            className={styles.select}
                        >
                            <option value="">Select a tag</option>
                            {tagLibrary.map((tag) => (
                                <option key={tag.tagName} value={tag.tagName}>
                                    {tag.tagName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.checkboxGroup}>
                        {tagLibrary.find((tag) => tag.tagName === editFields.tagList)?.subTag &&
                            Object.values(
                                tagLibrary.find((tag) => tag.tagName === editFields.tagList)?.subTag || {}
                            ).map((subtag, index) => (
                                <label key={index} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={editFields.subtagList?.includes(subtag)}
                                        onChange={(e) => {
                                            const newSubtags = e.target.checked
                                                ? [...(editFields.subtagList || []), subtag]
                                                : editFields.subtagList.filter((s) => s !== subtag);
                                            handleInputChange("subtagList", newSubtags);
                                        }}
                                    />
                                    {subtag}
                                </label>
                            ))}
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Creator</label>
                        <input
                            type="text"
                            value={creatorName}
                            readOnly
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Parameters</label>
                        {parameters.map((param, index) => (
                            <div key={index} className={styles.parameterItem}>
                                <input
                                    type="text"
                                    value={param.paramName || ""}
                                    onChange={(e) => {
                                        const updatedParameters = [...parameters];
                                        updatedParameters[index].paramName = e.target.value;
                                        setParameters(updatedParameters);
                                    }}
                                    className={styles.input}
                                />
                                <button
                                    onClick={() => {
                                        const updatedParameters = parameters.filter((_, i) => i !== index);
                                        setParameters(updatedParameters);
                                    }}
                                    className={`${styles.button} ${styles.deleteButton}`}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className={styles.section}>
                        <h2>Report Details</h2>
                        {renderReports()}
                    </div>

                    <div className={styles.section}>
                        <h2>Comments and Replies</h2>
                        {renderComments()}
                    </div>

                    <div className={styles.actions}>
                        <button className={`${styles.button} ${styles.denyButton}`}>
                            Deny Report Request
                        </button>
                        <button
                            onClick={handleUpdateProduct}
                            className={`${styles.button} ${styles.updateButton}`}
                        >
                            Update Product
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminEdit;
