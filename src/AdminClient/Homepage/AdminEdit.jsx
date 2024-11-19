import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import styles from "./AdminEdit.module.css"; // Import modular CSS
import Modal from "react-modal"; // 引入 React Modal
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const AdminEdit = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [productData, setProductData] = useState(null);
    const [adminId, setAdminId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [greeting, setGreeting] = useState("");
    const [isHeadAdmin, setIsHeadAdmin] = useState(false);
    const [editFields, setEditFields] = useState({});
    const [tagLibrary, setTagLibrary] = useState([]);
    const [parameters, setParameters] = useState([]);
    const [creatorName, setCreatorName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [reportDetails, setReportDetails] = useState({});
    const [comments, setComments] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [currentImage, setCurrentImage] = useState(productData?.productImage || '');
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [showAddParameter, setShowAddParameter] = useState(false);
    const [newParameterName, setNewParameterName] = useState("");
    const [imageError, setImageError] = useState("");
    const db = getFirestore();


    // Fetch product details
    // Fetch product details
    useEffect(() => {
        const checkLoginStatus = async () => {
          const localStatusToken = localStorage.getItem("adminAuthToken");
          if (localStatusToken) {
            const handleAdminRequest = httpsCallable(functions, "handleAdminRequest");
            try {
              const response = await handleAdminRequest({
                action: "checkLoginStatus",
                statusToken: localStatusToken,
              });
              if (response.data.success) {
                setAdminId(response.data.uid);
                setIsHeadAdmin(response.data.headAdmin);
              } else {
                setIsLoggedIn(false);
                localStorage.removeItem("adminAuthToken");
              }
            } catch (error) {
              setIsLoggedIn(false);
              localStorage.removeItem("adminAuthToken");
            }
          } else {
            setIsLoggedIn(false);
          }
        };
    
        const setTimeGreeting = () => {
          const now = new Date();
          const hour = now.getHours();
          const greetings = ["Good night", "Good morning", "Good afternoon", "Good evening"];
          const index =
            hour >= 5 && hour < 12 ? 1 : hour >= 12 && hour < 17 ? 2 : hour >= 17 && hour < 21 ? 3 : 0;
          setGreeting(greetings[index]);
        };
    
        checkLoginStatus();
        setTimeGreeting();
    
        const intervalId = setInterval(() => {
          checkLoginStatus();
          setTimeGreeting();
        }, 10000);
    
        return () => clearInterval(intervalId);
      }, []);


    const fetchProductDetails = async () => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        try {
            const response = await handleProductEntryRequest({ action: "fetchProducts" });
            const product = response.data.data.find((p) => p.id === productId);

            if (product) {
                setProductData(product);

                setEditFields({
                    productName: product.productName || "",
                    description: product.description || "",
                    tagList: product.tagList || "",
                    subtagList: product.subtagList || [],
                });

                if (product.parameters) {
                    const paramRefs = product.parametorList || [];
                    const paramPromises = paramRefs.map(async (paramId) => {
                        const paramRef = doc(db, 'Parameters', paramId);
                        const paramSnap = await getDoc(paramRef);
                        return paramSnap.exists() ? { paramId, ...paramSnap.data() } : null;
                    });
                    const parametersData = (await Promise.all(paramPromises)).filter(Boolean);

                    setProductData({ ...product, comments });
                    setParameters(parametersData);
                } else {
                    setParameters(new Array(10).fill({ paramName: "", paramId: null, isNew: true }));
                }

                if (product.productImage) {
                    setCurrentImage(product.productImage); // 设置当前图片
                } else {
                    setCurrentImage(""); // 或者设置默认图片路径
                }


                if (product.reportList) {
                    // Ensure fetchReports is called with productId
                    await fetchReports(productId);
                } else {
                    setReportDetails({});
                }

                if (product.creator) {
                    fetchCreatorName(product.creator);
                } else {
                    setCreatorName("Unknown Creator");
                }

                fetchComments(product.id);
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

    const handleDenyReportRequest = async () => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");

        try {
            setErrorMessage(""); // 清空错误信息
            setSuccessMessage(""); // 清空成功信息

            const response = await handleProductEntryRequest({
                action: "edit",
                productId,
                updates: {
                    flag: 0, // 更新 flag 为 0
                    reportList: [], // 清空 reportList
                    isLocked: false, // 解锁产品
                    lockedBy: null, // 清除锁定用户
                },
            });

            if (response.data.success) {
                setSuccessMessage("Report request denied successfully!");
                setTimeout(() => {
                    navigate("/admin/regularHome"); // 跳转到管理员主页
                }, 1500); // 延迟 1.5 秒后跳转，方便用户看到成功消息
            } else {
                setErrorMessage(`Error: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error denying report request:", error);
            setErrorMessage("Failed to deny report request. Please try again.");
        }
    };


    const handleParameterChange = (index, value) => {
        setParameters((prevParameters) => {
            console.log(`Previous parameters at index ${index}:`, prevParameters[index]); // Log the parameter before the update

            // Create a new array to update the state, ensuring immutability
            const updatedParameters = [...prevParameters];
            updatedParameters[index] = {
                ...updatedParameters[index], // Keep other fields of the parameter unchanged
                paramName: value, // Update the parameter name at the specified index
            };

            console.log(`Updated parameter at index ${index}:`, updatedParameters[index]); // Log the parameter after the update
            console.log(`Full updated parameters array:`, updatedParameters); // Log the entire updated parameters array

            return updatedParameters;
        });
    };


    /* const handleAddParameter = async () => {
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
     };*/

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
    const fetchCommentUsernames = (comments) => {
        comments.forEach((comment) => {
            if (!comment.user || !comment.user.username) {
                comment.user = { username: "Unknown User" };
            }
            if (comment.replies) {
                comment.replies.forEach((reply) => {
                    if (!reply.user || !reply.user.username) {
                        reply.user = { username: "Unknown User" };
                    }
                });
            }
        });
        return comments; // This function is now synchronous
    };


    // Fetch report details
    const fetchReports = async (productId) => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        try {
            const response = await handleProductEntryRequest({ action: "getReports", productId });
            if (response.data.success) {
                // 处理报告列表
                const processedReports = processReports(response.data.reportList || []);
                // 使用 fetchUsernames 更新用户名
                const updatedReports = await fetchUsernames(processedReports);
                setReportDetails(updatedReports); // 更新状态
            } else {
                setReportDetails({}); // 清空状态
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            setErrorMessage("Failed to fetch reports.");
        }
    };



    // Fetch comments
    const fetchComments = async (productId) => {
        const handleCommentRequest = httpsCallable(functions, "handleCommentRequest");
        try {
            const response = await handleCommentRequest({ action: "getCommentsWithReplies", productId });
            if (response.data.success) {
                const updatedComments = await fetchCommentUsernames(response.data.comments || []);
                setComments(updatedComments); // 确保用户信息正确映射
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

    const fetchUsernames = async (reportDetails) => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        const userIds = new Set();

        // 收集所有需要查询的用户 ID
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
                    idToUsername[id] = response.data.data.username || "Unknown User";
                } else {
                    idToUsername[id] = "Unknown User";
                }
            } catch (error) {
                console.error(`Error fetching username for ID ${id}:`, error);
                idToUsername[id] = "Unknown User";
            }
        });

        await Promise.all(fetchPromises);

        // 更新 reportDetails 中的 username 字段
        Object.values(reportDetails).forEach((details) => {
            details.reporters.forEach((reporter) => {
                reporter.username = idToUsername[reporter.id] || "Unknown User";
            });
        });

        return reportDetails;
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
        const allowedTypes = ["image/jpeg", "image/png"];

        if (file && !allowedTypes.includes(file.type)) {
            setImageError("Invalid file type. Please upload a JPEG or PNG image.");
            e.target.value = null; // Reset the input value
        } else {
            setImageError(""); // Clear any previous error messages
            setImageFile(file);
        }
    };

    const handleDeleteParameter = async (index) => {
        const parameterToDelete = parameters[index];

        if (!parameterToDelete || !parameterToDelete.paramId) {
            alert("Invalid parameter selected for deletion.");
            return;
        }

        try {
            const handleProductEntryRequest = httpsCallable(functions, 'handleProductEntryRequest');
            const response = await handleProductEntryRequest({
                action: "deleteParameter",
                productId: productId, // Replace with your product ID
                parameterId: parameterToDelete.paramId
            });

            if (response.data.success) {
                alert("Parameter deleted successfully!");
                // Update the local state to remove the deleted parameter
                setParameters((prevParameters) => prevParameters.filter((_, i) => i !== index));
            } else {
                console.error("Failed to delete parameter:", response.data.message);
                alert("Failed to delete parameter. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting parameter:", error);
            alert("An error occurred while deleting the parameter.");
        }
    };


    const handleConfirmAddParameter = async () => {
        if (!newParameterName.trim()) {
            alert("Please enter a valid parameter name.");
            return;
        }

        try {
            const handleProductEntryRequest = httpsCallable(functions, 'handleProductEntryRequest');
            const response = await handleProductEntryRequest({
                action: "addParameter",
                productId: productId, // Replace with your product ID
                parameterName: newParameterName
            });

            if (response.data.success) {
                alert("Parameter added successfully!");
                setParameters([...parameters, { paramName: newParameterName }]); // Update local state
                setShowAddParameter(false); // Hide the input box and button
                setNewParameterName(""); // Clear the input
            } else {
                console.error("Failed to add parameter:", response.data.message);
                alert("Failed to add parameter. Please try again.");
            }
        } catch (error) {
            console.error("Error adding parameter:", error);
            alert("An error occurred while adding the parameter.");
        }
    };

    const handleUpdateProduct = async () => {
        const handleProductEntryRequest = httpsCallable(functions, "handleProductEntryRequest");
        const handleParameterRequest = httpsCallable(functions, "handleParameterRequest");
        const handleImageUpload = httpsCallable(functions, "handleImageUpload");
        const generateId = httpsCallable(functions, "generateId");

        try {
            // 清空错误和成功消息
            setErrorMessage("");
            setSuccessMessage("");

            // 1. 上传新图片（如果存在）
            let productImage = currentImage;
            if (imageFile) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Image = reader.result.split(',')[1]; // Get base64 part

                    const handleImageRequest = httpsCallable(functions, 'handleImageRequest');
                    try {
                        const imageResponse = await handleImageRequest({
                            action: 'upload',
                            base64: base64Image,
                            filename: imageFile.name,
                            productId: productId
                        });
                        console.log('Image uploaded:', imageResponse);
                    } catch (error) {
                        console.error('Error uploading image:', error);

                    }
                };
                reader.readAsDataURL(imageFile);
            }

            // 2. 更新现有参数并添加新参数
            const newParameters = parameters.filter((param) => param.isNew && param.paramName.trim());
            const existingParameters = parameters.filter((param) => !param.isNew && param.paramId);
            const newParameterIds = []; // 存储新增参数的 ID

            try {
                // 添加新参数
                const addParameterPromises = newParameters.map(async (param) => {
                    const idResponse = await generateId({
                        type: "parameter",
                        name: param.paramName, // 使用参数名称作为 `name`
                    });

                    if (!idResponse.data.idNum) {
                        throw new Error("Failed to generate parameter ID.");
                    }

                    const paramId = idResponse.data.idNum; // 新生成的参数 ID
                    const addResponse = await handleParameterRequest({
                        action: "addParameter",
                        paramId,
                        productId,
                        paramName: param.paramName,
                    });

                    if (addResponse.data.success) {
                        newParameterIds.push(paramId); // 存储成功新增的参数 ID
                    } else {
                        console.error(`Failed to add parameter: ${param.paramName}`);
                    }
                });

                await Promise.all(addParameterPromises);

                // 更新现有参数
                const updateParameterPromises = existingParameters.map((param) =>
                    handleParameterRequest({
                        action: "updateParameter",
                        paramId: param.paramId,
                        updates: { paramName: param.paramName },
                    })
                );

                const updateResponses = await Promise.all(updateParameterPromises);

                if (!updateResponses.every((response) => response.data.success)) {
                    setErrorMessage("Failed to update some parameters. Please try again.");
                    return;
                }
            } catch (paramError) {
                console.error("Error updating parameters:", paramError);
                setErrorMessage("Failed to update parameters. Please try again.");
                return;
            }

            // 整合所有参数 ID
            const updatedParameterList = [
                ...existingParameters.map((param) => param.paramId),
                ...newParameterIds,
            ];

            // 3. 更新产品信息
            try {
                const productUpdateResponse = await handleProductEntryRequest({
                    action: "edit",
                    productId,
                    updates: {
                        ...editFields,
                        productImage, // 更新后的图片 URL
                        parametorList: updatedParameterList, // 更新后的参数列表
                    },
                });

                if (productUpdateResponse.data.success) {
                    // 更新成功后设置弹窗内容
                    setSuccessMessage("Product updated successfully!");
                    setNotificationMessage(
                        `Hello ${creatorName}! Since there are certain amount of report requests for the product "${editFields.productName}" you created, we checked and edited your product entry. You can go to your product entry page to see the newest modification. Thank you for using Judge Everything,\n\nSincerely,\n${adminId}.`
                    );
                    setNotificationModalOpen(true); // 打开通知弹窗
                } else {
                    setErrorMessage(productUpdateResponse.data.message || "Failed to update product.");
                }
            } catch (updateError) {
                console.error("Error updating product:", updateError);
                setErrorMessage("An unexpected error occurred while updating the product.");
            }
        } catch (error) {
            console.error("Unexpected error in handleUpdateProduct:", error);
            setErrorMessage("An unexpected error occurred. Please try again.");
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
            ariaHideApp={false} // Optional: Hide accessibility warnings during development
        >
            <div>
                <h2 className={styles.modalHeader}>Send Notification</h2>
                <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className={styles.notificationTextarea}
                />
                <div className={styles.modalActions}>
                    <button onClick={handleSendNotification} className={styles.sendButton}>
                        Send
                    </button>
                    <button onClick={handleCloseModal} className={styles.closeButton}>
                        Close
                    </button>
                </div>
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
                            <img src={currentImage} alt="Product" className={styles.imagePreview} />
                        ) : (
                            <p>No image available</p>
                        )}
                        <label htmlFor="fileInput" className={styles.fileInputLabel}>
                            Choose File
                        </label>
                        <input
                            id="fileInput"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.fileInput}
                        />
                        {imageError && <p className={styles.imageError}>{imageError}</p>}
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
                    <div className={styles.parameterSection}>
                        <h2>Parameters</h2>
                        {parameters.slice(0, 10).map((param, index) => (
                            <div key={index} className={styles.parameterItem}>
                                <input
                                    type="text"
                                    value={param.paramName || ""}
                                    onChange={(e) => handleParameterChange(index, e.target.value)}
                                    className={styles.parameterInput}
                                    placeholder={`Parameter ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteParameter(index)}
                                    className={styles.deleteButton}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}

                        {parameters.length < 10 && (
                            <div className={styles.addParameterContainer}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddParameter(true)}
                                    className={styles.addButton}
                                >
                                    Add Parameter
                                </button>

                                {showAddParameter && (
                                    <div className={styles.addParameterForm}>
                                        <input
                                            type="text"
                                            value={newParameterName}
                                            onChange={(e) => setNewParameterName(e.target.value)}
                                            placeholder="Enter parameter name"
                                            className={styles.parameterInput}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleConfirmAddParameter}
                                            className={styles.confirmButton}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
                        <button
                            onClick={handleDenyReportRequest}
                            className={`${styles.button} ${styles.denyButton}`}
                        >
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