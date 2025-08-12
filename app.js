import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBZhQu6SnsxZAI7scDJ6Y5gzae52BkvdvM",
    authDomain: "dashboard-a259e.firebaseapp.com",
    projectId: "dashboard-a259e",
    storageBucket: "dashboard-a259e.firebasestorage.app",
    messagingSenderId: "127822348716",
    appId: "1:127822348716:web:2c7daf06b54dcfd28b7a09",
    measurementId: "G-0TW5PHPB50"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const sbtn = document.getElementById("sbtn");
const lbtn = document.getElementById("lbtn");
const google = document.getElementById("google");
const logoutbtn = document.getElementById("logout");
const addProduct = document.getElementById("add-product");
const products = document.getElementById("Products");
const cartItems = document.getElementById("cart-items"); // for cart page

let editProductId = null;

if (sbtn) {
    sbtn.addEventListener("click", () => {
        let email = document.getElementById("semail").value;
        let password = document.getElementById("spass").value;
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => window.location.href = "/index.html")
            .catch(err => console.log(err.code, err.message));
    });
}
if (lbtn) {
    lbtn.addEventListener("click", () => {
        let email = document.getElementById("lemail").value;
        let password = document.getElementById("lpass").value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => window.location.href = "/dashboard.html")
            .catch(err => console.log(err.code, err.message));
    });
}

if (google) {
    google.addEventListener("click", () => {
        signInWithPopup(auth, provider)
            .then(() => window.location.href = "/dashboard.html")
            .catch(err => console.log(err.code, err.message));
    });
}


const currentUser = () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = "index.html";
    });
};
document.addEventListener("DOMContentLoaded", currentUser);
if (logoutbtn) {
    logoutbtn.addEventListener("click", () => {
        signOut(auth).then(() => window.location.href = "index.html");
    });
}
if (addProduct) {
    addProduct.addEventListener("click", async () => {
        let name = document.getElementById("pname").value;
        let price = document.getElementById("pprice").value;
        let description = document.getElementById("pdes").value;
        let imgUrl = document.getElementById("pimg").value;

        try {
            if (editProductId) {
                await updateDoc(doc(db, "products", editProductId), { name, price, description, imgUrl });
                editProductId = null;
                addProduct.innerText = "Add Product";
            } else {
                await addDoc(collection(db, "products"), { name, price, description, imgUrl });
            }
            getProducts();
        } catch (e) {
            console.error(e);
        }

        document.getElementById("pname").value = "";
        document.getElementById("pprice").value = "";
        document.getElementById("pdes").value = "";
        document.getElementById("pimg").value = "";
    });
}

const getProducts = async () => {
    if (!products) return;
    products.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach((d) => {
        products.innerHTML += `
        <div class="card mb-4" style="width: 300px;">
          <img src="${d.data().imgUrl}" class="card-img-top product-img" alt="${d.data().name}">
          <div class="card-body">
            <h5 class="card-title">${d.data().name}</h5>
            <h6 class="card-subtitle mb-2 text-muted">$${d.data().price}</h6>
            <p class="card-text">${d.data().description}</p>
            <button class="btn btn-warning btn-sm" onclick="editProduct('${d.id}', '${d.data().name}', '${d.data().price}', '${d.data().description}', '${d.data().imgUrl}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="delProduct('${d.id}')">Delete</button>
            <button class="btn btn-primary btn-sm" onclick="addToCart('${d.id}', '${d.data().name}', '${d.data().price}', '${d.data().imgUrl}')">Add to Cart</button>
          </div>
        </div>`;
    });
};
getProducts();


window.delProduct = async (id) => {
    if (confirm("Do you want to delete this product?")) {
        await deleteDoc(doc(db, "products", id));
        getProducts();
    }
};
window.editProduct = (id, name, price, description, imgUrl) => {
    document.getElementById("pname").value = name;
    document.getElementById("pprice").value = price;
    document.getElementById("pdes").value = description;
    document.getElementById("pimg").value = imgUrl;
    editProductId = id;
    addProduct.innerText = "Update Product";
};

window.addToCart = async (productId, name, price, imgUrl) => {
    const user = auth.currentUser;
    if (!user) {
        alert("Please login first");
        return;
    }
    try {
        await addDoc(collection(db, "carts"), {
            userId: user.uid,
            productId,
            name,
            price,
            imgUrl
        });
        alert("Product added to cart!");
    } catch (e) {
        console.error("Error adding to cart:", e);
    }
};

window.getCart = async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("Please login first");
        return;
    }
    const q = query(collection(db, "carts"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    if (!cartItems) return;
    cartItems.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cartItems.innerHTML += `
        <div style="border:1px solid #ccc;padding:10px;margin:10px;">
            <img src="${data.imgUrl}" width="50">
            <strong>${data.name}</strong> - $${data.price}
            <button onclick="removeFromCart('${docSnap.id}')">Remove</button>
        </div>`;
    });
};

window.removeFromCart = async (id) => {
    await deleteDoc(doc(db, "carts", id));
    if (cartItems) window.getCart();
};
