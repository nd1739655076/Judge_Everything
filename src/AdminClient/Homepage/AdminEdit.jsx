import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import styles from "./AdminEdit.module.css"; // Import modular CSS
import Modal from "react-modal"; // 引入 React Modal


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
    const [imageFile, setImageFile] = useState(null);
    const [currentImage, setCurrentImage] = useState("");
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    // Fetch product details
    // Fetch product details
    const fetchProductDetails = async () => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        try {
            const response = await handleProductEntryRequest({ action: "fetchProducts" });
            const product = response.data.data.find((p) => p.id === productId);

            if (product) {
                setProductData(product); // 设置产品数据
                setEditFields({
                    productName: product.productName || "",
                    description: product.description || "",
                    tagList: product.tagList || "",
                    subtagList: product.subtagList || [],
                }); // 初始化输入框
                setParameters(product.parameters || []); // 初始化参数
                setCurrentImage(product.productImage || ""); // 初始化图片
                fetchReports(product.id); // 加载报告
                fetchComments(product.id); // 加载评论

                // Fetch creator's username
                if (product.creator) {
                    fetchCreatorName(product.creator); // 通过creatorId获取username
                }
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

    const handleParameterChange = (index, value) => {
        const updatedParameters = [...parameters];
        updatedParameters[index] = {
            ...updatedParameters[index],
            paramName: value,
            isNew: !updatedParameters[index].paramId, // 只有没有ID时才标记为新参数
        };
        setParameters(updatedParameters);
    };

    const handleAddParameter = async () => {
        try {
            const generateId = httpsCallable(functions, "generateId");
            const response = await generateId({ type: "parameter" });
            if (response.data.success) {
                const newParameterId = response.data.idNum; // 使用idNum作为新ID
                const updatedParameters = [...parameters];
                updatedParameters.push({
                    paramId: newParameterId,
                    paramName: "",
                    isNew: true,
                });
                setParameters(updatedParameters);
            } else {
                setErrorMessage("Failed to generate a new parameter ID.");
            }
        } catch (error) {
            console.error("Error generating parameter ID:", error);
            setErrorMessage("Failed to add new parameter.");
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
                setReportDetails(updatedReports); // 更新报告状态
            } else {
                setReportDetails({}); // 确保状态为空
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            setErrorMessage("Failed to fetch reports.");
        }
    };

    // Fetch comments
    const fetchComments = async (productId) => {
        const handleAdminCommentRequest = httpsCallable(functions, "handleAdminCommentRequest");
        try {
            const response = await handleAdminCommentRequest({ action: "getCommentsWithReplies", productId });
            if (response.data.success) {
                setComments(response.data.comments || []);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    // Delete comment
    const deleteComment = async (commentId) => {
        const handleAdminCommentRequest = httpsCallable(functions, "handleAdminCommentRequest");
        try {
            const response = await handleAdminCommentRequest({
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

    const renderProductScore = () => {
        if (!productData?.averageScore) return null;
        const { average, totalScore, totalRater } = productData.averageScore;
        return (
            <div className={styles.section}>
                <h2>Product Average Score</h2>
                <p>Average: {average.toFixed(2)}</p>
                <p>Total Score: {totalScore}</p>
                <p>Total Raters: {totalRater}</p>
            </div>
        );
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setCurrentImage(reader.result); // Preview the new image
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProduct = async () => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        const handleParameterRequest = httpsCallable(functions, "handleParameterRequest");
        const handleImageUpload = httpsCallable(functions, "handleImageUpload");

        try {
            setErrorMessage("");
            setSuccessMessage("");

            // 上传新图片（如果有）
            let productImage = currentImage;
            if (imageFile) {
                try {
                    const base64Image = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result.split(",")[1]);
                        reader.onerror = (err) => reject(err);
                        reader.readAsDataURL(imageFile);
                    });

                    const uploadResponse = await handleImageUpload({
                        action: "uploadImage",
                        base64: base64Image,
                        productId: productId,
                    });

                    if (uploadResponse.data.success) {
                        productImage = uploadResponse.data.imageUrl; // 更新图片 URL
                    } else {
                        throw new Error(uploadResponse.data.message || "Failed to upload image.");
                    }
                } catch (uploadError) {
                    console.error("Error uploading image:", uploadError);
                    setErrorMessage("Failed to upload image.");
                    return;
                }
            }

            // 添加新参数（如果有）
            const newParameters = parameters.filter((param) => param.isNew && param.paramName);
            const newParameterIds = [];
            try {
                const addParameterPromises = newParameters.map((param) =>
                    handleParameterRequest({
                        action: "addParameter",
                        productId,
                        paramName: param.paramName,
                    })
                );
                const responses = await Promise.all(addParameterPromises);

                responses.forEach((response, index) => {
                    if (response.data.success) {
                        newParameterIds.push(response.data.paramId); // 新增参数 ID
                    } else {
                        console.error(`Failed to add parameter: ${newParameters[index].paramName}`);
                    }
                });
            } catch (paramError) {
                console.error("Error adding new parameters:", paramError);
                setErrorMessage("Failed to add new parameters.");
                return;
            }

            // 整合所有参数 ID
            const updatedParameterList = [
                ...parameters.filter((param) => !param.isNew).map((param) => param.paramId),
                ...newParameterIds,
            ];

            // 更新产品信息
            try {
                const response = await handleProductEntryRequest({
                    action: "edit",
                    productId,
                    updates: {
                        ...editFields,
                        productImage, // 更新后的图片 URL
                        parametorList: updatedParameterList, // 更新后的参数列表
                    },
                });

                if (response.data.success) {
                    // 更新成功后设置弹窗内容
                    setSuccessMessage("Product updated successfully!");
                    setNotificationMessage(
                        `Hello ${creatorName}! Since there are certain amount of report requests for the product "${editFields.productName}" you created, we checked and edited your product entry. You can go to your product entry page to see the newest modification. Thank you for using Judge Everything,\nAdmin.`
                    );
                    setNotificationModalOpen(true); // 打开通知弹窗
                } else {
                    setErrorMessage(`Error: ${response.data.message}`);
                }
            } catch (updateError) {
                console.error("Error updating product:", updateError);
                setErrorMessage("Failed to update product.");
            }
        } catch (error) {
            console.error("Unexpected error in handleUpdateProduct:", error);
            setErrorMessage("An unexpected error occurred while updating the product.");
        }
    };

      // 发送通知逻辑
      const handleSendNotification = async () => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        try {
            const response = await handleUserRequest({
                action: "sendNotification",
                creatorId: productData.creator,
                message: notificationMessage,
            });
            if (response.data.success) {
                alert("Notification sent successfully!");
            } else {
                alert("Failed to send notification.");
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            alert("An error occurred while sending the notification.");
        }
    };

       // 关闭弹窗
       const handleCloseModal = () => {
        setNotificationModalOpen(false);
    };


    const renderNotificationModal = () => (
        <Modal
            isOpen={notificationModalOpen}
            onRequestClose={handleCloseModal}
            className={styles.modal}
            overlayClassName={styles.modalOverlay}
        >
            <h2>Send Notification</h2>
            <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows="6"
                className={styles.notificationTextarea}
            />
            <div className={styles.modalActions}>
                <button onClick={handleSendNotification} className={styles.sendButton}>
                    Send Notification
                </button>
                <button onClick={handleCloseModal} className={styles.closeButton}>
                    Close
                </button>
            </div>
        </Modal>
    );

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
                    {/* Display Current Image */}
                    <div className={styles.imageSection}>
                        <h2>Current Image</h2>
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt="Product"
                                className={styles.productImage}
                            />
                        ) : (
                            <p>No image available</p>
                        )}
                        <label className={styles.changeImageButton}>
                            Change Picture
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className={styles.imageInput}
                            />
                        </label>
                    </div>
                    <div className={styles.section}>
                        {renderProductScore()}
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
                        <h2>Parameters</h2>
                        {parameters.map((param, index) => (
                            <div key={index} className={styles.parameterItem}>
                                <input
                                    type="text"
                                    value={param.paramName}
                                    onChange={(e) => handleParameterChange(index, e.target.value)}
                                    className={styles.input}
                                    placeholder={`Parameter ${index + 1}`}
                                />
                            </div>
                        ))}
                        <button onClick={handleAddParameter} className={styles.addButton}>
                            Add Parameter
                        </button>
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
            {renderNotificationModal()}
        </div>
    );
};

export default AdminEdit;
