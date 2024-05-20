import React, { Suspense } from "react";
import { Button, Flex, Form, Image, Input, InputNumber, Select, Space, Tag, Modal, Typography, Spin, Result, Empty, Card, App } from "antd";
import Locations from "./locations";
import TextArea from "antd/es/input/TextArea";
import PlaceHolderImage from "./assets/placeholder-image.png";
import ErrorImage from "./assets/error.png";
import ZCrawl from "./crawl";

const inputMaxWidth = { width: "100%" };

const storageUploadConfig = {
  API_URL: localStorage.getItem("config_API_URL") || "",
  SESSION_ID: localStorage.getItem("config_SESSION_ID") || "",
  EVAL_URL: localStorage.getItem("config_EVAL_URL") || "",
};

export default function AddPost() {
  const [uploadConfig, setUploadConfig] = React.useState(storageUploadConfig);
  const { modal, message } = App.useApp();
  const [post, setPost] = React.useState({});
  const [form] = Form.useForm();
  const formWatchProvinceChange = Form.useWatch("province", form);
  const [firstRender, setFirstRender] = React.useState(true);
  const [images, setImages] = React.useState(post.images);
  const [avatar, setAvatar] = React.useState("");
  const [provinces] = React.useState(Locations.sort(sortLocationName));
  const [districts, setDistricts] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState(true);
  const [uploadProcessText, setUploadProcessText] = React.useState("Uploading...");
  const [crawlURL, setCrawlURL] = React.useState("");
  const [crawling, setCrawling] = React.useState(false);

  const handleFinish = async (_post) => {
    _post = { ..._post, ...uploadConfig }; //Add config
    _post.avatar = avatar;
    _post.images = images;
    _post.images = _post.images.filter((img) => _post.avatar != img.replace("/media/photos/", "/media/photos/tmb/")); //Remove avatar has watermark on album

    //Cast properties to number
    _post.nam_sinh = _post.nam_sinh ? Number(_post.nam_sinh) : null;
    _post.chieu_cao = _post.chieu_cao ? Number(_post.chieu_cao) : null;
    _post.can_nang = _post.can_nang ? Number(_post.can_nang) : null;
    _post.gai_di_khach = _post.gai_di_khach ? Number(_post.gai_di_khach) : null;

    //Validate image & avatar
    if (!_post?.images || _post.images.length < 5 || _post.images.length > 20) {
      return modal.confirm({
        title: "Thiếu album ảnh",
        content: (
          <Space direction="vertical">
            <Typography.Text>Hãy chọn album ảnh cho bài viết</Typography.Text>
            <Flex vertical>
              <Typography.Text italic>- Tối thiểu 5 ảnh</Typography.Text>
              <Typography.Text italic>- Tối đa 20 ảnh</Typography.Text>
            </Flex>
          </Space>
        ),
        footer: (_, { OkBtn }) => <OkBtn />,
      });
    }

    if (!_post?.avatar) {
      return modal.confirm({
        title: "Thiếu ảnh đại diện",
        content: "Hãy chọn ảnh đại diện cho bài viết",
        footer: (_, { OkBtn }) => <OkBtn />,
      });
    }

    //Upload
    setUploading(true);
    setUploadStatus(false);
    setUploadProcessText("Uploading...");
    try {
      console.log(_post);
      //Check phone
      setUploadProcessText("Check phone...");
      const dataCheckPhone = await (await fetch(`https://api.gaigoiz.org/api/check_phone?phone=${_post.so_dien_thoai}`)).json();
      if (!dataCheckPhone.status) {
        message.error(dataCheckPhone.message);
        setUploadStatus(dataCheckPhone);
      } else {
        //Upload
        setUploadProcessText("Uploading...");
        const response = await (
          await fetch(uploadConfig.EVAL_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(_post) })
        ).json();
        setUploadStatus(response);
      }
    } catch (error) {
      setUploadStatus({ status: false, message: error.message });
    }
    setUploading(false);
    setUploadProcessText("Finished!");
  };

  const handelCrawl = async () => {
    if (uploading) return message.warning("Post is uploading");
    setCrawling(true);

    try {
      const data = await ZCrawl(crawlURL);
      if (data) {
        message.success("Crawl success");
        setPost(data);
      } else {
        message.error("Crawl error");
      }
    } catch (error) {
      message.error(error.message);
    }
    setCrawling(false);
  };

  //Chọn district khi province thay đổi
  React.useEffect(() => {
    if (formWatchProvinceChange) {
      const district = provinces.find((province) => province.slug === formWatchProvinceChange);
      if (district) {
        if (!firstRender) form.setFieldValue("district", ""); //Reset district value
        setDistricts(district.districts.sort(sortLocationName));
        setFirstRender(false);
      }
    }
  }, [formWatchProvinceChange]);

  //Change form values on post changed
  React.useEffect(() => {
    setFirstRender(true);
    form.setFieldsValue(post);
    setAvatar("");
    setImages(post.images);
  }, [post]);

  return (
    <Suspense fallback={"Loading..."}>
      <Flex gap={12} wrap>
        <Input
          onChange={(e) => {
            const value = e.target.value;
            localStorage.setItem("config_API_URL", value);
            setUploadConfig({ ...uploadConfig, API_URL: value });
          }}
          defaultValue={uploadConfig.API_URL}
          addonBefore="API Upload"
          placeholder="API Upload"
        />
        <Input
          onChange={(e) => {
            const value = e.target.value;
            localStorage.setItem("config_SESSION_ID", value);
            setUploadConfig({ ...uploadConfig, SESSION_ID: value });
          }}
          defaultValue={uploadConfig.SESSION_ID}
          addonBefore="Session ID"
          placeholder="Session ID"
        />
        <Input
          onChange={(e) => {
            const value = e.target.value;
            localStorage.setItem("config_EVAL_URL", value);
            setUploadConfig({ ...uploadConfig, EVAL_URL: value });
          }}
          defaultValue={uploadConfig.EVAL_URL}
          addonBefore="Eval URL"
          placeholder="Eval URL"
        />

        <Space.Compact style={{ width: "100%" }}>
          <Input value={crawlURL} onChange={(e) => setCrawlURL(e.target.value)} placeholder="Gaigu detail url" />
          <Button type="primary" onClick={handelCrawl} loading={crawling}>
            Crawl
          </Button>
        </Space.Compact>
      </Flex>

      <Form
        spellCheck={false}
        form={form}
        onFinish={handleFinish}
        layout="vertical"
        style={{ marginTop: "1rem" }}
        initialValues={{ province: "", district: "", xuat_xu: "UNKNOWN", avatar: PlaceHolderImage, ...post }}
      >
        <Flex gap={12} align="flex-start" id="post_detail_header">
          {/* Preview avatar */}
          <Flex vertical style={{ position: "relative" }}>
            <Image
              fallback={ErrorImage}
              placeholder={
                <Flex align="center" justify="center">
                  <Spin />
                </Flex>
              }
              style={{ width: "100%", aspectRatio: "2/3", borderRadius: 8, objectFit: "cover", border: "1px solid #ffffff3d" }}
              width={160}
              src={avatar || PlaceHolderImage}
            />

            <Button htmlType="submit" type="primary" loading={uploading}>
              Đăng bài
            </Button>
          </Flex>

          <Flex vertical style={{ width: "100%", flex: 1 }}>
            {/* Title */}
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[
                { required: true, message: "Hãy nhập tiêu đề" },
                { max: 200, message: "Tiều đề quá dài" },
              ]}
              style={{ width: "100%", flex: 1 }}
              required
            >
              <Input type="text" count={{ show: true, max: 200 }} placeholder="Tiêu đề bài viết" />
            </Form.Item>
            <Form.Item
              name="content"
              label="Mô tả"
              rules={[
                { required: true, message: "Hãy nhập mô tả" },
                { max: 6000, message: "Mô tả quá dài" },
              ]}
              style={{ marginTop: "1rem" }}
              required
            >
              <TextArea rows={6} count={{ show: true, max: 6000 }} placeholder="Mô tả ngắn cho bài viết" />
            </Form.Item>
          </Flex>
        </Flex>

        {/*Detail  */}
        <div className="grid_post_detail" style={{ marginTop: "1rem" }}>
          <Form.Item
            name="nghe_danh"
            label="Nghệ danh"
            rules={[
              { required: true, message: "Hãy nhập nghệ danh" },
              { max: 80, message: "Nghệ danh quá dài" },
            ]}
            required
          >
            <Input type="text" placeholder="VD: Yến Nhi" count={{ show: true, max: 80 }} />
          </Form.Item>

          <Form.Item
            name="so_dien_thoai"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Hãy nhập số điện thoại" },
              { min: 8, message: "Không hợp lệ" },
              { max: 16, message: "Không hợp lệ" },
            ]}
            required
          >
            <Input type="number" placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item name="gia_di_khach" label="Giá đi khách (K)" rules={[{ required: true, message: "Hãy nhập giá đi khách" }]} required>
            <InputNumber min={0} max={9999999} style={inputMaxWidth} placeholder="VD: 600" />
          </Form.Item>

          <Form.Item name="province" label="Khu vục (Tỉnh/Thành)" rules={[{ required: true, message: "Hãy chọn khu vục (Tỉnh/Thành)" }]} required>
            <Select>
              <Select.Option value="">-- Chưa chọn --</Select.Option>
              {provinces.map((province) => (
                <Select.Option value={province.slug} key={`province_${province.slug}`}>
                  {province.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="district" label="Khu vực (Quận/Huyện)">
            <Select>
              <Select.Option value="">-- Chưa chọn --</Select.Option>
              {districts.map((district, index) => (
                <Select.Option value={district.slug} key={`districts_${index}_${district.slug}`}>
                  {district.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="xuat_xu" label="Xuất xứ">
            <Select>
              <Select.Option value="UNKNOWN">-- Chưa chọn --</Select.Option>
              <Select.Option value="BAC">Miền Bắc</Select.Option>
              <Select.Option value="TRUNG">Miền Trung</Select.Option>
              <Select.Option value="NAM">Miền Nam</Select.Option>
              <Select.Option value="TAY">Miền Tây</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="dia_chi" label="Địa chỉ">
            <Input type="text" placeholder="Địa chỉ cụ thể" />
          </Form.Item>

          <Form.Item name="gia_phong" label="Giá phòng">
            <Input type="text" placeholder="VD: 100k/h" />
          </Form.Item>

          <Form.Item name="nam_sinh" label="Năm sinh">
            <InputNumber min={1970} max={3000} style={inputMaxWidth} placeholder="VD: 2000" />
          </Form.Item>

          <Form.Item name="chieu_cao" label="Chiều cao (cm)">
            <InputNumber min={100} max={300} style={inputMaxWidth} placeholder="VD: 165" />
          </Form.Item>

          <Form.Item name="can_nang" label="Cân nặng (kg)">
            <InputNumber min={10} max={500} style={inputMaxWidth} placeholder="VD: 55" />
          </Form.Item>

          <Form.Item
            name="so_do_3_vong"
            label="Số đo 3 vòng"
            rules={[
              {
                pattern: new RegExp(/^([0-9]+)-([0-9]+)-([0-9]+)$/),
                message: "Phải có dạng v1-v2-v3",
              },
            ]}
          >
            <Input type="text" placeholder="VD: 88-60-90" />
          </Form.Item>

          <Form.Item name="dich_vu" label="Dịch vụ">
            <Input type="text" placeholder="VD: HJ, BJ, 69, Vét máng, ..." />
          </Form.Item>

          <Form.Item name="thoi_gian_phuc_vu" label="Thời gian phục vụ">
            <Input type="text" placeholder="VD: 30-40p" />
          </Form.Item>

          <Form.Item name="gio_lam_viec" label="Giờ làm việc">
            <Input type="text" placeholder="VD: 24/24" />
          </Form.Item>

          <Form.Item name="cam_ket" label="Cam kết">
            <Input type="text" placeholder="VD: Không cháo hàng,..." />
          </Form.Item>

          <Form.Item name="pass" label="Pass">
            <Input type="text" placeholder="Pass" />
          </Form.Item>
        </div>
        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="VD: Gái gọi 2k, Gái gọi qua đêm" notFoundContent={false} />
        </Form.Item>

        <Card>
          <Flex vertical gap={"1rem"}>
            <Space>
              <Tag color="#2db7f5">All ({post?.images?.length || 0})</Tag>
              <Tag color="#87d068">Select ({images?.length || 0})</Tag>
            </Space>
            {/* Preview album */}
            {/* setImages(images.filter((img) => img !== image)) */}
            {(images?.length || 0) > 0 ? (
              <Space wrap align="start">
                {images.map((image, index) => (
                  <Card
                    key={`image_${image}`}
                    className="item-preview-image"
                    classNames={{ actions: "item-preview-image-actions" }}
                    styles={{
                      actions: {
                        padding: 0,
                      },
                    }}
                    actions={[
                      <i
                        key={"select_avatar"}
                        onClick={() => {
                          message.info("Avatar is changed!");
                          setAvatar(image.replace("/media/photos/", "/media/photos/tmb/"));
                        }}
                        style={{ color: "green" }}
                        className="ri-id-card-line item-preview-image-action"
                      ></i>,
                      <i
                        key={"delete_image"}
                        onClick={() => setImages(images.filter((img) => img !== image))}
                        style={{ color: "red" }}
                        className="ri-delete-bin-6-line item-preview-image-action"
                      ></i>,
                    ]}
                  >
                    <Image
                      fallback={ErrorImage}
                      placeholder={
                        <Flex align="center" justify="center">
                          <Spin />
                        </Flex>
                      }
                      width={100}
                      style={{ borderRadius: 1 }}
                      preview={{ toolbarRender: () => <></> }}
                      src={image}
                    />
                  </Card>
                ))}
              </Space>
            ) : (
              <Empty description="Chưa có ảnh nào được chọn" />
            )}
          </Flex>
        </Card>
      </Form>

      {/* Upload result model */}
      <Modal
        title={"Thông báo"}
        open={uploadStatus?.message ? true : false}
        onOk={() => setUploadStatus(false)}
        onCancel={() => setUploadStatus(false)}
        footer={(_, { OkBtn }) => <OkBtn />}
      >
        <Result
          status={uploadStatus.status ? "success" : "error"}
          title={`Đăng bài ${uploadStatus.status ? "thành công" : "thất bại"}`}
          subTitle={uploadStatus.message || ""}
        />
      </Modal>

      {/* Loading model */}
      <Modal
        title={
          <Flex align="center" gap={6}>
            <Spin size="small"></Spin> Đang tải lên
          </Flex>
        }
        open={uploading}
        closable={!uploading}
        footer={(_) => <></>}
      >
        <Result icon={<Spin size="large"></Spin>} title="Bài viết của bạn đang được tải lên..." subTitle={uploadProcessText} />
      </Modal>
    </Suspense>
  );
}

function sortLocationName(a, b) {
  return a.name.localeCompare(b.name);
}
