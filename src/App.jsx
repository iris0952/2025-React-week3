import { useEffect, useState, useRef } from 'react'
import axios from "axios";
import * as bootstrap from "bootstrap";
import "./assets/style.css";

// API 設定
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const BASIC_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
}

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isAuth, setIsAuth] = useState(false);

  const [products, setProduct] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(BASIC_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  const productModalRef = useRef(null);

  function handleInputChange(e) {
    const { name, value } = e.target ;
    // console.log(name, value);
    setFormData((preData) =>({
      ...preData, 
      [name]: value
    }));
  }

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target ;
    // console.log(name, type === 'checkbox' ? checked : value);
    setTemplateProduct((preData) =>({
      ...preData, 
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleModalImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl]
      newImage[index] = value;

      // 填寫最後一個空輸入框時，自動新增空白輸入框
      if (
        value !== "" &&
        index === newImage.length - 1 &&
        newImage.length < 5
      ) {
        newImage.push("");
      }

      // 清空輸入框時，移除最後的空白輸入框
      if (
          value === "" &&
          newImage.length > 1 &&
          newImage[newImage.length - 1] === ""
        ) {
        newImage.pop();
      }

      return{
        ...pre,
        imagesUrl: newImage
      }
    })
  }

  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage= [...pre.imagesUrl]
      newImage.push("");
      return{
        ...pre,
        imagesUrl: newImage
      }
    })
  }

  const handleDeleteImage = () => {
    setTemplateProduct((pre) => {
      const newImage= [...pre.imagesUrl]
      newImage.pop();
      return{
        ...pre,
        imagesUrl: newImage
      }
    })
  }
  
  const getProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`); 
      // console.log(res.data);
      setProduct(res.data.products)
      
    } catch (error) {
      console.log(error);
      
    }
  }

  // 修正後的 updateProduct 函式
  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product}`;
    let method = "post";

    // 關鍵修正：確保 templateProduct.id 是一個字串
    if (modalType === "edit") {
      // 檢查 id 是否為字串，如果不是，就報錯或停止執行
      if (typeof id !== 'string' || !id) {
          console.error("錯誤：產品 ID 無效或遺失。", templateProduct);
          alert("無法更新產品，因為產品 ID 無效。");
          return;
      }
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
    }

    const productData = {
      data: {
        title: templateProduct.title,
        category: templateProduct.category,
        unit: templateProduct.unit,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        description: templateProduct.description,
        content: templateProduct.content,
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imageUrl: templateProduct.imageUrl,
        imagesUrl: templateProduct.imagesUrl.filter(url => url !== ""),
      }
    };


    // console.log('準備送出的資料:', method.toUpperCase(), url, JSON.stringify(productData, null, 2));

    try {
      const res = await axios[method](url, productData);
      alert(res.data.message);
      getProducts();
      closeModal();
    } catch (error) {
      console.error('API 請求失敗:', error.response?.data || error.message || error);
      alert(`操作失敗：${error.response?.data?.message || '請檢查網路連線或 API 權限'}`);
    }
  }

  const deleteProduct = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      console.log(res.data);
      getProducts();
      closeModal();
    }catch (error) {
      console.log(error.message);
      
    }
  }

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/admin/signin`, formData);
      console.log(res.data);
      //設定 cookie
      const { token, expired} = res.data;
      document.cookie = `camiToken=${token};expires=${new Date(expired)};`
      // 修改實體建立時所指派的預設配置
      axios.defaults.headers.common['Authorization'] = token;
      setIsAuth(true);
      getProducts();
    } catch (error) {
      console.dir(error);
      setIsAuth(false);
    }
  }

 
  
  useEffect(() => {
    // 讀取 Cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("camiToken="))
      ?.split("=")[1];
    if (token) { //取得 token 將它塞到 headers
      axios.defaults.headers.common['Authorization'] = token;
    }

    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false
    });
    const checkLogin = async () => {
      try {
        const res = await axios.post(`${API_BASE}/api/user/check`);
        alert(res.data.message);
        setIsAuth(true);
        getProducts();
      } catch (error) {
        alert(error.response?.data.message);
        setIsAuth(false);
      }
    }

    checkLogin();
    
  }, [])

  const openModal = (type, product) => {
    // console.log('顯示產品',product);
    setModalType(type);
    setTemplateProduct({
      ...product, // 展開所有從 API 來的資料
      is_enabled: product.is_enabled, 
      imagesUrl: product.imagesUrl || [], // 確保 imagesUrl 是陣列
    });
    productModalRef.current.show();
  }
  

  const closeModal = () => {
    productModalRef.current.hide();
  }


  return (
    <>
      { ! isAuth ? (
        <div className="container login">
          <h2 className='text-secondary'>寵物攝影館</h2>
          <form className="form-floating" onSubmit={(e) => submitForm(e)}>
            <div className="form-floating mb-3">
              <input 
                type="email" 
                name='username' 
                className="form-control" 
                id="floatingInput" 
                placeholder="name@example.com" 
                value={formData.username} 
                onChange={(e)=>handleInputChange(e)}
              />
              <label htmlFor="floatingInput">Email address</label>
            </div>
            <div className="form-floating">
              <input 
                type="password" 
                name='password' 
                className="form-control" 
                id="floatingPassword" 
                placeholder="Password"
                value={formData.password}
                onChange={(e)=>handleInputChange(e)}
              />
              <label htmlFor="floatingPassword">Password</label>
            </div>
            <button type="submit" className="btn btn-success w-100 mt-3">登入</button>
          </form>
        </div>
      ) : (
        <div className="container text-center mt-3">
          <h2>產品列表</h2>
          {/* 新增產品按鈕 */}
          <div className="text-end mt-4">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => openModal("create", BASIC_TEMPLATE_DATA)}
            >
              建立新的產品
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">分類</th>
                <th scope="col">產品名稱</th>
                <th scope="col">原價</th>
                <th scope="col">售價</th>
                <th scope="col">是否啟用</th>
                <th scope="col">編輯</th>
              </tr>
            </thead>
            <tbody>
              {
                products.map(product => (
                  <tr key={product.id}>
                    <td>{product.category}</td>
                    <th scope="row">{product.title}</th>
                    <td>{product.origin_price}</td>
                    <td>{product.price}</td>
                    <td className={`${product.is_enabled && 'text-success'}`}>{product.is_enabled ? '啟用' : '未啟用'}</td>
                    <td>
                      <div className="btn-group" role="group" aria-label="Basic example">
                        <button type="button" className="btn btn-outline-success btn-sm"
                          onClick={() => openModal("edit", product)}
                        >編輯</button>
                        <button type="button" className="btn btn-outline-danger btn-sm"
                        onClick={() => openModal("delete", product)}>刪除</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
        >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className={`modal-header 
              bg-${modalType === "delete" ? 'danger' : 'dark'} text-white`}>
              <h5 id="productModalLabel" className="modal-title">
                <span>{modalType === "delete" ? '刪除' : modalType === 'edit' ? '編輯' : '新增'}產品</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ></button>
            </div>
            <div className="modal-body">
              {
                modalType === 'delete' ? (
                  <p className="fs-4">
                    確定要刪除
                    <span className="text-danger">{templateProduct.title}</span>嗎？
                  </p>
                ):(
                  <div className="row">
                    <div className="col-sm-4 mb-3">
                      <div className="mb-2">
                        <div className="mb-3">
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            id="imageUrl"
                            name="imageUrl"
                            className="form-control"
                            placeholder="請輸入圖片連結"
                            value={templateProduct.imageUrl}
                            onChange={(e) => handleModalInputChange(e)}
                            />
                        </div>
                        {
                          templateProduct.imageUrl && (
                            <img className="img-fluid" src={templateProduct.imageUrl} alt="主圖" />
                          )
                        }
                      </div>
                      <div className='mb-3'>
                        {
                          templateProduct.imagesUrl.map((url, index) => (
                            <div key={index}>
                              <label htmlFor="imageUrl" className="form-label">
                                輸入圖片網址
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder={`圖片網址${index + 1}`}
                                value={url}
                                onChange={(e) => handleModalImageChange(index, e.target.value)}
                              />
                              {
                                url && (
                                  <img
                                    className="img-fluid"
                                    src={url}
                                    alt={`副圖${index + 1}`}
                                  />
                                )
                              }
                            </div>
                          ))
                        }
                        {//優化：圖片長度小於5時，顯示新增圖片按鈕
                          templateProduct.imagesUrl.length < 5 &&
                          templateProduct.imagesUrl[templateProduct.imagesUrl.length - 1] !== "" &&

                          <button className="btn btn-outline-primary btn-sm d-block w-100"
                            onClick={() => handleAddImage()}
                          >
                            新增圖片
                          </button>
                        }
                      </div>
                      <div>
                        {
                          templateProduct.imagesUrl.length >= 1 &&
                          <button className="btn btn-outline-danger btn-sm d-block w-100" onClick={() => handleDeleteImage()}>
                            刪除圖片
                          </button>

                        }
                      </div>
                    </div>
                    <div className="col-sm-8">
                      <div className="mb-3">
                        <label htmlFor="title" className="form-label">標題</label>
                        <input
                          name="title"
                          id="title"
                          type="text"
                          className="form-control"
                          placeholder="請輸入標題"
                          value={templateProduct.title}
                          onChange={(e) => handleModalInputChange(e)}
                          // disabled={modalType === 'edit'} 可以鎖定欄位無法編輯
                          />
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="category" className="form-label">分類</label>
                          <input
                            name="category"
                            id="category"
                            type="text"
                            className="form-control"
                            placeholder="請輸入分類"
                            value={templateProduct.category}
                            onChange={(e) => handleModalInputChange(e)}
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="unit" className="form-label">單位</label>
                          <input
                            name="unit"
                            id="unit"
                            type="text"
                            className="form-control"
                            placeholder="請輸入單位"
                            value={templateProduct.unit}
                            onChange={(e) => handleModalInputChange(e)}
                            />
                        </div>
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="origin_price" className="form-label">原價</label>
                          <input
                            name="origin_price"
                            id="origin_price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入原價"
                            value={templateProduct.origin_price}
                            onChange={(e) => handleModalInputChange(e)}
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="price" className="form-label">售價</label>
                          <input
                            name="price"
                            id="price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入售價"
                            value={templateProduct.price}
                            onChange={(e) => handleModalInputChange(e)}
                            />
                        </div>
                      </div>
                      <hr />

                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">產品描述</label>
                        <textarea
                          name="description"
                          id="description"
                          className="form-control"
                          placeholder="請輸入產品描述"
                          value={templateProduct.description}
                          onChange={(e) => handleModalInputChange(e)}
                          ></textarea>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="content" className="form-label">說明內容</label>
                        <textarea
                          name="content"
                          id="content"
                          className="form-control"
                          placeholder="請輸入說明內容"
                          value={templateProduct.content}
                          onChange={(e) => handleModalInputChange(e)}
                          ></textarea>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            name="is_enabled"
                            id="is_enabled"
                            className="form-check-input"
                            type="checkbox"
                            checked={templateProduct.is_enabled}
                            onChange={(e) => handleModalInputChange(e)}
                            />
                          <label className="form-check-label" htmlFor="is_enabled">
                            是否啟用
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </div>
            <div className="modal-footer">
              {
                modalType === 'delete' ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteProduct(templateProduct.id)}
                  >
                    刪除
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      data-bs-dismiss="modal"
                      onClick={() => closeModal()}
                      >
                      取消
                    </button>
                    <button type="button" className="btn btn-primary" 
                      // onClick={() => updateProduct(templateProduct.id)}
                      onClick={() => updateProduct(templateProduct.id)}
                    >確認</button>
                  </>
                )
              }
              
            </div>
          </div>
        </div>
      </div>

      
    </>
  )
}

export default App