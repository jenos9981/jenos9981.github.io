import $ from 'jquery';


export default async function crawl(crawlURL) {
    const GAIGU_DOMAIN = new URL(crawlURL).origin;
    const html = await (await fetch(`${window["CORS_URL"]}?url=${encodeURIComponent(crawlURL)}`)).text();
    const _$ = $(html);


    const post = {};
    post.title = _$.find(".head-title h1")
        .text()
        .trim()
        .replace(/_/g, "-")
        .replace(/-/g, " - ")
        .replace(/\s{2,}/g, " "); //Replace duplicate spaces

    post.nghe_danh = post.title
        .slice(0, post.title.lastIndexOf("-"))
        .trim()
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    post.so_dien_thoai = "";
    post.gia_di_khach = "";
    post.province = "";
    post.district = "";
    post.xuat_xu = "";
    post.dia_chi = "";
    post.gia_phong = "100k/h";
    post.nam_sinh = "";
    post.chieu_cao = "";
    post.can_nang = "";
    post.so_do_3_vong = "";
    post.dich_vu = "";
    post.thoi_gian_phuc_vu = "";
    post.gio_lam_viec = "";
    post.cam_ket = "Không ảnh ảo, không tráo hành, không công nghiệp";
    post.pass = "Lấy số ở GaiGoiZ";
    post.tags = [];
    post.content = _$.find(".mt-3.overflow-hidden.desc-spc").html().replace(/<br>/g, "\n").replace(/\n\n/g, "\n").trim();
    /**  */

    const xValues = _$.find(".attributes .col-md-8.col-8");
    _$.find(".attributes .col-md-4.col-4").each((i, ele) => {
        const key = $(ele).text().trim();
        const value = $(xValues.get(i)).text().trim();

        if (key == "Giá") post.gia_di_khach = value.replace("K", "");
        if (key == "Số điện thoại") post.so_dien_thoai = value;
        if (key == "Năm sinh") post.nam_sinh = value;
        if (key == "Chiều cao") post.chieu_cao = value.replace("cm", "");
        if (key == "Cân nặng") post.can_nang = value.replace("kg", "");
        if (key == "Số đo 3 vòng") post.so_do_3_vong = value;
        if (key == "Xuất xứ") post.xuat_xu = slugify(value.replace("Miền", "")).toUpperCase().trim();
        if (key == "Khu vực") post.province = value;
        if (key == "Địa chỉ") post.dia_chi = value;
        if (key == "Làm việc") post.gio_lam_viec = value;
        if (key == "Dịch vụ") post.dich_vu = value;
    });

    const locations = post.province.split("/");
    post.province = slugify(locations[0]);
    post.district = slugify(locations[1]);
    post.images = [];
    _$.find(".img-preview li img").each((i, e) => post.images.push(GAIGU_DOMAIN + ($(e).attr("src") || $(e).attr("data-cfsrc"))));

    //Fix location
    if (post.district === "can-tho") post.district = ""; // TP Can Tho
    if (post.district === "tra-vinh") post.district = ""; // TP Tra Vinh
    if (post.district === "my-dinh") post.tags.push("Gái gọi Mỹ Đình");

    //tag
    locations.map((lv) => post.tags.push(`Gái gọi ${lv}`));
    post.dia_chi.split(',').slice(0, 2).map((lv) => post.tags.push(`Gái gọi ${lv.trim()}`));
    if (post.nam_sinh == 2000) post.tags.push("Gái gọi 2k");
    if (post.nam_sinh == 2001) post.tags.push("Gái gọi 2k1", "Gái Teen");
    if (post.nam_sinh == 2002) post.tags.push("Gái gọi 2k2", "Gái Teen");
    if (post.nam_sinh == 2003) post.tags.push("Gái gọi 2k3", "Gái Teen");
    if (post.nam_sinh == 2004) post.tags.push("Gái gọi 2k4", "Gái Teen");
    if (post.nam_sinh == 2005) post.tags.push("Gái gọi 2k5", "Gái Teen");
    if (post.nam_sinh == 2006) post.tags.push("Gái gọi 2k6", "Gái Teen");
    if (post.nam_sinh == 2007) post.tags.push("Gái gọi 2k7", "Gái Teen");
    if (post.gia_di_khach < 500) post.tags.push("Gái gọi giá rẻ", `Gái gọi ${post.gia_di_khach}K`);
    if (post.dich_vu.match(/qua đêm/i)) post.tags.push("Gái gọi qua đêm");
    if (post.dich_vu.match(/Some/i)) post.tags.push("Gái gọi Some");



    //Unique
    post.tags = Array.from(new Set([...post.tags]));
    post.images = Array.from(new Set([...post.images]));

    /**  */
    console.log(post)
    try {
        // chrome.runtime.sendMessage(post)
        // chrome.storage.local.set({ post }, () => { });
        return post
    } catch (error) {
        console.error(error);
        return false;
    }
}


/**  */
function slugify(string) {
    const a = "àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;";
    const b = "aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------";
    const p = new RegExp(a.split("").join("|"), "g");
    return string
        .toString()
        .toLowerCase()
        .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "a")
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "e")
        .replace(/i|í|ì|ỉ|ĩ|ị/gi, "i")
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "o")
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "u")
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, "y")
        .replace(/đ/gi, "d")
        .replace(/\s+/g, "-")
        .replace(p, (c) => b.charAt(a.indexOf(c)))
        .replace(/&/g, "-and-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

function makeid(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
