--
-- PostgreSQL database dump
--

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: incident_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.incident_type_enum AS ENUM (
    'theft',
    'robbery',
    'harassment',
    'noise',
    'accident',
    'other'
);


ALTER TYPE public.incident_type_enum OWNER TO postgres;

--
-- Name: severity_level_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.severity_level_enum AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE public.severity_level_enum OWNER TO postgres;

--
-- Name: haversine_distance(double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.haversine_distance(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision) RETURNS double precision
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    R INTEGER := 6371; -- Bán kính Trái Đất (km)
    dLat double precision;
    dLon double precision;
    a double precision;
    c double precision;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    a := SIN(dLat / 2) * SIN(dLat / 2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dLon / 2) * SIN(dLon / 2);
    c := 2 * ASIN(SQRT(a));
    RETURN R * c; -- Khoảng cách (km)
END;
$$;


ALTER FUNCTION public.haversine_distance(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_generation_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_generation_queue (
    id integer NOT NULL,
    property_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    payload jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone
);


ALTER TABLE public.ai_generation_queue OWNER TO postgres;

--
-- Name: ai_generation_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_generation_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_generation_queue_id_seq OWNER TO postgres;

--
-- Name: ai_generation_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_generation_queue_id_seq OWNED BY public.ai_generation_queue.id;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: properties_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.properties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.properties_id_seq OWNER TO postgres;

--
-- Name: properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.properties_id_seq OWNED BY public.properties.id;


--
-- Name: property_safety_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_safety_scores (
    property_id integer NOT NULL,
    overall_score numeric(3,1) NOT NULL,
    crime_score numeric(3,1),
    user_score numeric(3,1),
    environment_score numeric(3,1),
    last_updated_at timestamp with time zone NOT NULL,
    ai_summary text
);


ALTER TABLE public.property_safety_scores OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    property_id integer NOT NULL,
    user_id integer NOT NULL,
    safety_rating smallint NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cleanliness_rating smallint,
    amenities_rating smallint,
    host_rating smallint,
    CONSTRAINT reviews_amenities_rating_check CHECK (((amenities_rating >= 1) AND (amenities_rating <= 5))),
    CONSTRAINT reviews_cleanliness_rating_check CHECK (((cleanliness_rating >= 1) AND (cleanliness_rating <= 5))),
    CONSTRAINT reviews_host_rating_check CHECK (((host_rating >= 1) AND (host_rating <= 5))),
    CONSTRAINT reviews_safety_rating_check CHECK (((safety_rating >= 1) AND (safety_rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: safety_points; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.safety_points (
    id integer NOT NULL,
    name character varying(255),
    address text,
    point_type character varying(50),
    severity_score integer,
    data_source character varying(255),
    location public.geography(Point,4326)
);


ALTER TABLE public.safety_points OWNER TO postgres;

--
-- Name: safety_points_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.safety_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.safety_points_id_seq OWNER TO postgres;

--
-- Name: safety_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.safety_points_id_seq OWNED BY public.safety_points.id;


--
-- Name: safety_points_staging; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.safety_points_staging (
    ten_diem character varying(255),
    dia_chi text,
    kinh_do double precision,
    vi_do double precision,
    loai_diem character varying(50),
    diem_trong_so integer,
    nguon_du_lieu character varying(255)
);


ALTER TABLE public.safety_points_staging OWNER TO postgres;

--
-- Name: security_incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_incidents (
    id integer NOT NULL,
    property_id integer,
    latitude double precision,
    longitude double precision,
    incident_type public.incident_type_enum NOT NULL,
    severity public.severity_level_enum NOT NULL,
    incident_date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.security_incidents OWNER TO postgres;

--
-- Name: security_incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.security_incidents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_incidents_id_seq OWNER TO postgres;

--
-- Name: security_incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.security_incidents_id_seq OWNED BY public.security_incidents.id;


--
-- Name: ai_generation_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_queue ALTER COLUMN id SET DEFAULT nextval('public.ai_generation_queue_id_seq'::regclass);


--
-- Name: properties id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties ALTER COLUMN id SET DEFAULT nextval('public.properties_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: safety_points id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.safety_points ALTER COLUMN id SET DEFAULT nextval('public.safety_points_id_seq'::regclass);


--
-- Name: security_incidents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_incidents ALTER COLUMN id SET DEFAULT nextval('public.security_incidents_id_seq'::regclass);


INSERT INTO public.safety_points (id, name, address, point_type, severity_score, data_source, location) VALUES
(1, 'Danang Professional Training College', '99 Tô Hiến Thành, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000D01154E8970F5B40D545651E540F3040'),
(2, 'Trường Cao đẳng Phương Đông Đà Nẵng', '32 Phan Đăng Lưu, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000C274102A270E5B403260240F9F093040'),
(3, 'Danang Vocational Tourism College', 'Nam Kỳ Khởi Nghĩa, Tổ 69, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000001AA132B7E105B4015F2F7414CF42F40'),
(4, 'Trường Cao đẳng Kinh tế - Kế hoạch Đà Nẵng', '143 Nguyễn Lương Bằng, Phường, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000048F718517F095B4047B2A2618C133040'),
(5, 'Trường Cao Đẳng Công Nghệ Y Dược Việt Nam - Đà Nẵng', 'Phòng tuyển sinh y dược, 116 Nguyễn Huy Tưởng, Hoà An, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000004DE438A6DD0A5B400A922D814A0D3040'),
(6, 'Đại Việt Danang College', '65 Nguyễn Lộ Trạch, Hoà Cường Nam, Hải Châu, Đà Nẵng 552478, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000056AF6C309E0E5B409C50888043083040'),
(7, 'College of IT Danang University', 'Đường Nam Kỳ Khởi Nghĩa Lưu Quang Vũ, Làng Đại học, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000098D41A94FA0F5B4025091DCFC2F12F40'),
(8, 'Vietnam - Korea University of Information and Communication Technology', '470 Trần Đại Nghĩa, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000B5DD04DF34105B409F2C6B5155F32F40'),
(9, 'Trường Cao đẳng Văn hóa Nghệ thuật Đà Nẵng', '130 Lê Quang Đạo, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000016E1815CBD0F5B4000B3D6AB230C3040'),
(10, 'Trường Cao Đẳng Bách Khoa Đà Nẵng', '271 Tố Hữu, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000D31D7A417A0D5B402DB70FD484083040'),
(11, 'Trường Cao đẳng Lạc Việt', '42-46 Phan Châu Trinh, Hải Châu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000CBB91457150E5B40641AF27453113040'),
(12, 'College transport 2', '28 Ngô Xuân Thu, Hoà Hiệp Bắc, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000005EC026C68D075B4064A1E760471F3040'),
(13, 'University of Economics - The University of Đà Nẵng', '71 Ngũ Hành Sơn, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000C3503D88530F5B40008BFCFA210C3040'),
(14, 'Trường Cao Đẳng Đà Nẵng (cơ sở 3)', 'Mai Đăng Chơn, Hoà Quý, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000024F7CF2EBA0E5B407BE69B23E1ED2F40'),
(15, 'Trường cao đẳng Lương Thực Thực Phẩm', '101B Lê Hữu Trác, P.An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000139CFA40720F5B40A4F908A1280F3040'),
(16, 'University of Technology and Education - University of Đà Nẵng', '48 Cao Thắng, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000FD2A65BEA80D5B40C194DCBCCC133040'),
(17, 'Trường Cao Đẳng Quốc Tế Pegasus Đà Nẵng', 'Vùng Trung 3, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000003A0A6BBEA5105B40AB3C26F7E0FA2F40'),
(18, 'Trường Cao đẳng Thương mại', '45 Đ. Dũng Sĩ Thanh Khê, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000022D85D456B0B5B40A529A7E26B123040'),
(19, 'Dong A University', '33 Xô Viết Nghệ Tĩnh, Hòa Cường, Hải Châu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000007901F6D1290E5B40E006C60B33083040'),
(20, 'Trường Cao đẳng Công nghệ Ngoại Thương', '46 đường phan châu trinh, phường Hải châu 1, Đà Nẵng, 50000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000006BABA3F4160E5B40F4C6A41A51113040'),
(21, 'Trường Cao đẳng Nghề Nguyễn Văn Trỗi', '69 Đoàn Hữu Trưng, Hoà An, Cẩm Lệ, Đà Nẵng 59000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000EA814534700B5B40387870C1630D3040'),
(22, 'Trường Cao đẳng Hoa Sen', 'Q, 39 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 50307, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000F402475D460C5B40F5DC9D1095113040'),
(23, 'Đại học Đà Nẵng', '41 Lê Duẩn, Hải Châu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000A7C6F07D160E5B40F4B171B32E123040'),
(24, 'Da Nang University of Medical Technology and Pharmacy', '99 Hùng Vương, Hải Châu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000004AEF1B5FFB0D5B4053DAD1EE46113040'),
(25, 'Da Nang University of Science and Technology', '54 Nguyễn Lương Bằng, Hoà Khánh Bắc, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000CA6B257497095B40F500CC6BDB123040'),
(26, 'Cao Đẳng Anh Quốc BTEC FPT', '66 Võ Văn Tần, Chính Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000068C64730FA0C5B40EDBAB72231113040'),
(27, 'Danang Architecture University', '566 Núi Thành, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000C6CF903B360E5B400AD7A3703D083040'),
(28, 'University of Science and Education - The University of Danang', '459 Tôn Đức Thắng, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000008F006E162F0A5B4028E2BE1FC80F3040'),
(29, 'University of Foreign Language Studies - University of Đà Nẵng', '131 Lương Nhữ Hộc, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000471163E38B0D5B4067046564DA083040'),
(30, 'School of medicine and pharmacy – The university of danang', 'Đ. Lưu Quang Vũ, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000C9B72D80DF0F5B40F50AB03495F22F40'),
(31, 'Campus in Da Nang of MUCE', '544 B Nguyễn Lương Bằng, Hoà Hiệp Nam, Liên Chiểu, Đà Nẵng, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E610000034E6BF51BC085B4093DD712FD5193040'),
(32, 'Trường Cao đẳng CNTT Chuyên Nghiệp', '92 Quang Trung, Thạch Thang, Hải Châu, Đà Nẵng 50255, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000568330B7FB0D5B409E1FEB4E1C133040'),
(33, 'Cao đẳng fpt', '260 Hải Phòng, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E6100000C918C4AC3C0D5B40AF1F07CA12123040'),
(34, 'Phổ thông Cao đẳng FPT Polytechnic Đà Nẵng', '137 Đường Nguyễn Thị Thập, Thanh Khê Tây, Liên Chiểu, Đà Nẵng, Vietnam', 'university_college', 3, 'Google Places API', '0101000020E61000003468E89FE00A5B405078BFC062133040'),
(35, 'Da Nang City Police', '80 Lê Lợi, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000E8DA17D00B0E5B40774EB340BB133040'),
(36, 'Đồn Công An Xuất Nhập Cảnh', '3643+J5J, Hòa Thuận Tây, Hải Châu, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E610000085A80C2DFC0C5B40C680913C7C0E3040'),
(37, 'Đồn Công an phường Xuân Hà', '48 Xuân Đán 1, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E61000009A0EF8576A0C5B403328E494CA113040'),
(38, 'Da Nang City Investigation Police Agency Office', '47 Lý Tự Trọng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000E2A47A7C0C0E5B40DE228B8FAA133040'),
(39, 'Phòng Cảnh sát Cơ động - Công an Thành phố Đà Nẵng', '150 Đà Sơn, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E61000001C3E8E8B0F0A5B40782AE09EE70B3040'),
(40, 'Thanh Khe District Police', '324 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000B4B002D7F00B5B40B963FBDA440F3040'),
(41, 'Phòng CSGT - Công an TP Đà Nẵng', '77 Võ An Ninh, Hoà Xuân, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E61000002EB18DD3EB0D5B4070DA4246F6013040'),
(42, 'Công an quận Cẩm Lệ', '2683+Q9P, Cách Mạng Tháng 8, Hòa Thọ Đông, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000443B5DCC050D5B40114AA99553043040'),
(43, 'Công an quận Sơn Trà', '36CM+2CQ, Huy Du, An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000D1A9D0E5F20E5B40CC65FE2CF1113040'),
(44, 'Police Hoa Cuong Nam Ward', '561 Núi Thành, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000BE1D9727460E5B4072158BDF14083040'),
(45, 'Công an phường Thanh Khê Đông', '739 Trần Cao Vân, Thanh Khê Đông, Thanh Khê, Đà Nẵng, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000016FDCBDB70B5B4092E057F66E113040'),
(46, 'Báo Công an Thành phố Đà Nẵng', '62 Phan Châu Trinh, Hải Châu, Đà Nẵng 50206, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E61000007E4ADFB5150E5B402C4DA5FA29113040'),
(47, 'Ngu Hanh Son district police', '492 Đ. Lê Văn Hiến, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000500D45CB4B105B404FA5B09CCE033040'),
(48, 'Công An Phường An Khê', '394 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E6100000C7DD7B139E0B5B405971056FA30E3040'),
(49, 'Công an phường Sơn Trà', '37 Đ. Trần Hưng Đạo, Nại Hiên Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 'police_station', 15, 'Google Places API', '0101000020E610000056CFEE35A90E5B4008B18E3E41153040'),
(50, 'TOP TV Club', '26VF+MFR, Khu Bắc tượng đài, Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000E305C71B4F0E5B40CF2C0950530B3040'),
(51, 'New Oriental Nightclub', '20 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000E20C5938240E5B40CBBFF11021153040'),
(52, 'ADM CLUB', 'Khu công viên Bắc Đài tưởng niệm, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000AB7E00AD540E5B406A108BBDBC0B3040'),
(53, 'The Roof - Da Nang', '1a Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000B0123D3ABF0F5B40B77F65A549113040'),
(54, 'For You Club', '52-55 Trần Văn Trứ, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000CDF40137410E5B40315F5E807D0E3040'),
(55, 'OQ Club', '18-20 Bạch Đằng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000003C629923500E5B40B8ABFCD75E143040'),
(56, 'Sugar Social Club', '100 Yên Bái, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000D06BA2853A0E5B402A25BA1DD0103040'),
(57, 'Koto Club Da Nang', '254 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000A1F31ABBC40F5B4068B9C72D410F3040'),
(58, 'Karma Lounge Da Nang', '6 Trần Quốc Toản, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000008CA438A2560E5B40549FF53AF3103040'),
(59, 'Hair Of The Dog Bar Danang', '06 Trần Quốc Toản, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000B651F8C7560E5B40E9787187F2103040'),
(60, 'Sky36', '36 Bạch Đằng, Street, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000009A8C7450530E5B40DEB87B6FC2133040'),
(61, 'Malibu Beach Club - Seaside Chill & Cocktails', 'Bãi tắm, Đường võ nguyên giáp/3 Phạm Văn Đồng, Nằm khu vực bãi tắm, Sơn Trà, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000636424D6BD0F5B40D6880563E9123040'),
(62, 'Điểm Nóng+ Eat, Drink & Music', '37 Nguyễn Tri Phương, Thạc Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000CFBEF2203D0D5B40CAEDA87BAE0E3040'),
(63, 'Kết High', '200 Bạch Đằng, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000007A782A3B580E5B40AF4E84C3C1103040'),
(64, 'Sky 21 Bar & Bistro', 'Parosand Danang Hotel, 216 Đường võ nguyên giáp, phường An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E610000026E9F582AA0F5B40C606C1994E113040'),
(65, 'Bar Đồ Yêu - Authentic Vietnamese Cocktail', '87 Hoàng Văn Thụ, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000175C188E0C0E5B40E7F1C52819103040'),
(66, 'NYX Sky Lounge & Mixology', '182 Bạch Đằng, Street, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000067D8E345D0E5B40B4233031F1103040'),
(67, 'On The Radio Bar', '76 Thái Phiên, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000975C209C2A0E5B4068B922E7B3103040'),
(68, 'The 1920''s Lounge', '53 Trần Quốc Toản, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000D95A5F24340E5B400D970B4BF2103040'),
(69, 'Sophie Lounge - Bar', '150 Bạch Đằng, Hải Châu, Đà Nẵng 50000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000001002976C610E5B4057EC2FBB27113040'),
(70, 'Hybrid Sports Lounge: Watch | Play | Dine', '26 Đỗ Bá, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000B7D8486DBD0F5B405BC3561A420D3040'),
(71, 'New Golden Pine Pub', '325 Đ. Trần Hưng Đạo, An Hải Bắc, Sơn Trà, Đà Nẵng 590000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000004ADC195CA90E5B40CFE5BCB502133040'),
(72, 'Bamboo 2 Bar', '216 Bạch Đằng, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E610000063B25D46560E5B4077D267ACA2103040'),
(73, 'C Bar', '100 Lê Quang Đạo, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000A0820D99BC0F5B409D88D926700C3040'),
(74, 'New 92 Club - Night Club Hoi An', 'Bờ Hồ 1, Cẩm Hà, Hội An, Quảng Nam, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000E4F736FD59145B40A9ED7085C1CA2F40'),
(75, 'NEW 212 CLUB', 'DMT MARINA CORP, Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000004573AE72B20E5B40B1506B9A77103040'),
(76, 'Monaco Club ( Quán Bar - Vũ Trường)', '91 Đ. Lý Thái Tổ, Tân Lợi, Buôn Ma Thuột, Đắk Lắk 630000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000E11EF065C7035B403843BB54B6652940'),
(77, 'EAZY D', '72-74 Hùng Vương, Hải Châu, Đà Nẵng 50000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E610000095CCFB49460E5B40A71F798C97113040'),
(78, 'Boss Bar Lounge', '178 Phạm Văn Đồng, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000005C8FC2F5280F5B40206DD223FC113040'),
(79, 'BUNNY Bar & Lounge 2', '12 Nguyễn Du, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000598B4F01300E5B40F12900C633143040'),
(80, 'Regency Club Lounge', '5 Trường Sa, Street, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000F69C4F78E4105B402A50300851033040'),
(81, 'Vip Club', '17 Quang Trung, Hải Châu, Đà Nẵng 550000, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E6100000BDEE63BB310E5B405074B8B134133040'),
(82, 'Trong Dong Dance Hall', '9 Đ. 2 Tháng 9, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'nightlife_bar', -7, 'Google Places API', '0101000020E61000009ABD22AE520E5B40601E32E543083040'),
(83, 'K-MART', '432/14 Võ Nguyên Giáp, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000002CB6EE8BF00F5B4028A325EA600A3040'),
(84, 'G’Local Mart & Cafe', 'Lô 4 - A3.5, Khu Đảo Xanh, Phường Hoà Cường Bắc, Hòa Cường, Đà Nẵng, 500000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000021956247630E5B407909A936930C3040'),
(85, 'Gimme Mart 24h Convenience Store', '89 An Thượng 29, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000F08403C69F0F5B40DD47C9062D0D3040'),
(86, 'ONE STOP - 24/7 Convenience, Drinks, Eats & Specialties', '35 Trần Bạch Đằng, Phường An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000004AF963BB30F5B4073785270C20E3040'),
(87, 'V+ Mini Mart 24/7', '01 Trần Quốc Toản, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000001A9B6736590E5B4064D817BFDF103040'),
(88, 'Oh! Mart Đà Nẵng - Cửa hàng tiện lợi 24/7', '271 Hồ Nghinh, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000EA65CA3D930F5B4049980E42E5103040'),
(89, 'PK Mart cửa hàng tiện lợi 24/7', '36-38 đường An Thượng 26, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 50000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000B8C4364EAF0F5B4022B193B0250E3040'),
(90, 'Vie Mart - 96 Trịnh Công Sơn', '96 Trịnh Công Sơn, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000C8CCAA741C0E5B4081E03B7B78083040'),
(91, 'V+ Mini Mart 24/7', '147 Đ. Trần Hưng Đạo, Nại Hiên Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000050C76306AA0E5B40A55478865F143040'),
(92, 'DRAGON Mart & Cafe 24h', 'A30 Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000020C54A16C10E5B40B747CA7102103040'),
(93, 'Cửa hàng tiện lợi KENKIN', '26PV+279, Khuê Mỹ, Ngũ Hành Sơn, Da Nang, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000331E00CC900F5B402E2D3421F7083040'),
(94, 'Mini mart: Đặc sản miền Trung-Cửa hàng tiện lợi', '23 Võ Văn Kiệt, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000009EE0ACD2A70F5B405DFDD8243F103040'),
(95, 'Full-Market', '247 Đ. Lê Văn Hiến, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 50000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000B052E68B62105B40BA19C9795A033040'),
(96, 'Nov.Mart 24/7', '45 Hà Bổng, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000001E424B0DA30F5B40F8E7FDDA55113040'),
(97, 'Cửa hàng tiện lợi S8 Mart', '58 Lý Thái Tông, Thanh Khê Tây, Đà Nẵng, 50000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000001F57D92D380B5B40F40A557B22133040'),
(98, 'Cửa Hàng VPP Hồng Hà', '82 Thái Phiên, Phường Minh An, Hội An, Quảng Nam, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000C936154EF7145B401F227F7A7DC32F40'),
(99, 'Soco Mart 247', '48 Lê Đình Dương, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000012C8DB00220E5B408AB1A778B70F3040'),
(100, 'Cửa Hàng Tiện Lợi Nmart', 'K79, 14 Lê Hữu Trác, An Hải Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000352905DD5E0F5B406943B40C270F3040'),
(101, 'Mart-Kikimo', '46 Ngô Thì Sĩ, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000006CA68CC9AC0F5B40813DCB98270C3040'),
(102, 'Full-Market', '225 Hoàng Kế Viêm, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000DC227A63D20F5B40F5053E50B80C3040'),
(103, 'Hello mart ( cửa hàng tiện lợi )', '30 Lâm Hoành, Phước Mỹ, Sơn Trà, Đà Nẵng 50000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000003464E190B20F5B40B8BA5285F50F3040'),
(104, 'Nina mart cửa hàng tiện lợi', 'An Đồn 6, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000258ADA47380F5B40A33616B94C123040'),
(105, 'D''Mart', '5 Lê Hồng Phong, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000036B3F1BB440E5B40052C5ED152103040'),
(106, 'Cửa hàng tiện lợi 24h - 2! Mart', '379B Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000004B2F7B23840A5B40934957FA1A0F3040'),
(107, 'Cửa hàng tiện lợi 24h - 2! Mart - 84 Kinh Dương Vương', '84 Kinh Dương Vương, Thanh Khê Tây, Liên Chiểu, Đà Nẵng, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000B8DAD48A000B5B402387E354C6123040'),
(108, 'Cửa Hàng Tiện Lợi Good Mart', '207 Lê Quang Đạo, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000085590D2EC20F5B406A566C825E0C3040'),
(109, 'D''Mart', '80 Trần Phú, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000E85D06AD510E5B406C031CE7DB113040'),
(110, 'D''Mart & More - 19 Trần Quốc Toản', '19 Trần Quốc Toản, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000002838ABF4490E5B403755F7C8E6103040'),
(111, 'V+ Mini Mart 24/7', '193 Nguyễn Văn Linh, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000F84B3041B20D5B40B144B126600F3040'),
(112, 'SPEED L Đà Nẵng', '6 Nại Nam, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000002C7BB71EAA0E5B405EDCA1BCEA083040'),
(113, 'WinMart+', '112 Nguyễn Duy Hiệu, Cẩm Châu, Hội An, Quảng Nam, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000F846BE5C55165B4074B33F506EC32F40'),
(114, 'Full-Market', 'Lô 39 Bùi Tá Hán, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000002B31CF4A5A0F5B40319B5B7C65073040'),
(115, 'Nina Mart', '114 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000084ACB882B70F5B40C309F1ED02143040'),
(116, 'Cửa hàng tiện lợi Aauminimart', '236 Trần Bạch Đằng, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000D9C57E60D80F5B401E5F8C92A10C3040'),
(117, 'CENTERBOX & MART - Siêu Thị Tiện Lợi 247 & Karaoke Box Music', '97 Ngô Tất Tố, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50153, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000DA649EA6E00D5B4067F915C671093040'),
(118, 'LEE 24/7 CONVENIENCE STORE', '39 Thái Phiên, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000007E7F80D380E5B40011E0714A0103040'),
(119, 'T-MARKET', '220 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000AE9B525EAB0F5B405289A18B3C113040'),
(120, 'Vini Minimart', 'V8GG+9H5, Nguyễn Phúc Chu, Phường Minh An, Hội An, Quảng Nam, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000E4BB94BAE4145B40199E4DFD72C02F40'),
(121, 'OKO mart', '152 Trần Bạch Đằng, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000000119952FC30F5B4012222A9EC40D3040'),
(122, 'OKONO', '180 Đỗ Bá, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000338D2617630F5B4019AFD40EDA0C3040'),
(123, 'V+ Mini Mart 24/7', '36 Mỹ Khê 4, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000009CEBEA44B80F5B40D20CF32F930E3040'),
(124, 'MART43', '89 Đỗ Bá, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000029266F80990F5B4031DB04CE080D3040'),
(125, 'Winmart+ 296 Nguyễn Hoàng', '296 Đ. Nguyễn Hoàng, Phước Ninh, Thanh Khê, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000E934C126A10D5B4026AAB706B60E3040'),
(126, 'AB Mart', '06 Hoàng Dư Khương, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000003F654689A70D5B40BAAAA22E08073040'),
(127, 'GOPI MART - Phan Thành Tài', '37 Phan Thành Tài, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000009771D601C0E5B406671B504CF0D3040'),
(128, 'Mart & More', '181 - 183 Hồ Nghinh, Phước Mỹ, Sơn Trà, Đà Nẵng 50000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000D99EB4CB920F5B40988922A46E113040'),
(129, 'Cửa hàng tiện lợi', '75 Trần Đình Đàn, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000A1E76047AD0F5B4080C1C99129143040'),
(130, 'Ninamart', '14 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000D009A1832E0E5B40BA15C26A2C153040'),
(131, 'Sun mini.mart', '02 Vương Thừa Vũ, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000056C73BD1BF0F5B408CE7227486143040'),
(132, 'GOPI MART - Đường 2 Tháng 9', '252 Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000039CBD1883E0E5B409C30067BB80B3040'),
(133, 'N Mart', '209 Nguyễn Duy Hiệu, Cẩm Châu, Hội An, Quảng Nam, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000001191F52FA4155B4018A5958CADC12F40'),
(134, 'HELLO MART', '48 Đường võ nguyên giáp, Mân Thái, Sơn Trà, Đà Nẵng, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000006FF02A10E20F5B4009707A17EF153040'),
(135, 'MOONMILK Market', '112 Lê Quang Đạo, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000585DE223BD0F5B4000F1A952690C3040'),
(136, 'Auminimart 7', '45 Hà Bổng, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000094B42CA9A40F5B403F94C38256113040'),
(137, 'Full Market 24h', 'Đối Diện, 04 Trần Quang Diệu, An Hải Tây, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000004FBAE303F10E5B4019ECE126FE0D3040'),
(138, 'ICHI MART', '184 Trần Phú, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000CD5603394D0E5B408A4F4BBDB8103040'),
(139, 'SOCOmart', 'Tầng hầm, 305 Nguyễn Văn Thoại, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E610000003D42F6CA80F5B403BA17CE6510E3040'),
(140, 'Siêu Thị Mini 24/7 ARES MART CS2', '23 Nguyễn Hữu Thọ, Hòa Thuận Nam, Hải Châu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E61000009615D4015A0D5B405C1C3AE2350E3040'),
(141, 'Sontra mini Mart 24h', 'Lô 41 Hoàng Sa, Thọ Quang, Sơn Trà, Đà Nẵng, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000C26C020C4B105B40B2E611ED74193040'),
(142, 'Tạp hoá Leo', '61b Đ. Phạm Như Xương, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'convenience_store', 4, 'Google Places API', '0101000020E6100000A8C821E2E6095B40B974273339103040'),
(143, 'Queen Palace Karaoke Đà Nẵng', '179 Xô Viết Nghệ Tĩnh, Phường, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000C1029832700D5B400EEE7321FB073040'),
(144, 'Karaoke Box Music ( Phòng Hát Mini - FIUSOUND)', '160/17 Đ. Nguyễn Hoàng, Phước Ninh, Thanh Khê, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000012802491A20D5B40FE648C0FB30F3040'),
(145, 'PREMIER LOUNGE', '62 Nguyễn Xuân Khoát, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000E4F38AA71E0F5B403BF59210F6113040'),
(146, '다낭 가라오케 NEW 에덴 가라오케', '05 Duy Tân, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000045549742D60D5B40A23C98B9650C3040'),
(147, 'ROYAL Karaoke Club', '308 Nguyễn Hữu Thọ, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000E28F47156A0D5B4050919E7D40093040'),
(148, 'GINZA Bar & Lounge', '9 Phan Bội Châu, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000004888F2052D0E5B40DCEFF55A75143040'),
(149, 'Karaoke Sương Chiều', '3 Thanh Thủy, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000029B6DD5F980D5B40192EBCDC71143040'),
(150, 'Karaoke RETRO', '175 Phùng Hưng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000093212290A60A5B4059CD29B7A3123040'),
(151, 'Karaoke Louis - 46 Ngô Văn Sở', '46 Ngô Văn Sở, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000EE72B62597095B409EDACF189C113040'),
(152, 'YOKO Bar & Lounge', '111 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000ADB54137450F5B40E0980A968F113040'),
(153, 'TinTin KTV karaoke & Bar', '13 Khuê Mỹ Đông 1, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng 50000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000007ABF76D5A80F5B40F6B0BC5065093040'),
(154, 'Karaoke Wonder', '133A Nguyễn Tất Thành, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000B2FBE99AA40D5B40EA07759142153040'),
(155, 'Royal karaoke', '288 Kinh Dương Vương, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000145B41D3920A5B40D78E3DD6E7133040'),
(156, 'Junco Karaoke', '441 Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000006C7BBB25B90E5B4037D263A593103040'),
(157, 'YUMI Counter & Lounge', '187 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000B8D8A326300F5B408FCC7E38A3113040'),
(158, 'K Box - Recording and Mart 🎤', '319 Lê Thanh Nghị, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000899B53C9000E5B408033E7CF6D083040'),
(159, 'Karaoke Melody Elementary La', '113 Tiểu La, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000EF2719EFFD0D5B40799C58969E0B3040'),
(160, '다낭 가라오케 업타운 UP TOWN', '54 Võ Nghĩa, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000A862748A9F0F5B400E92F41F88123040'),
(161, 'Karaoke Night Club', '33 Bàu Trảng 3, Thanh Khê Tây, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000002A49E878960B5B40E0F76F5E9C103040'),
(162, 'Karaoke Phương Trí', '90/2 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000066F50EB7430C5B40DD39DE2E45113040'),
(163, 'KARAOKE SONIC', '67 Đ. Nguyễn Tường Phổ, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000B147F2A6EC0A5B408E5DFD33DE0F3040'),
(164, 'ADM CLUB', 'Khu công viên Bắc Đài tưởng niệm, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000AB7E00AD540E5B406A108BBDBC0B3040'),
(165, 'Home Lounge & Bar', '34 Nguyễn Chí Thanh, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000002F145564190E5B407C07E4B78D133040'),
(166, 'Karaoke Idol - Đà Nẵng', '184 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000FA92324EE80D5B4033BD699F33143040'),
(167, 'Karaoke Song Ca', '1 An Thượng 21, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000004FA84CD64D0F5B40E43BE75DAB0D3040'),
(168, 'Karaoke Tieng To Dong', '15 Phan Thành Tài, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000048E7B2872C0E5B40F9E41714BC0D3040'),
(169, 'BLANK Lounge & Bar', '223 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000009489B6BE230F5B407E5F121DB8113040'),
(170, 'Las Vegas Karaoke', '26WF+CGG, Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000005EA2D524530E5B403AD4A535BC0B3040'),
(171, 'TOP TV Club', '26VF+MFR, Khu Bắc tượng đài, Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000E305C71B4F0E5B40CF2C0950530B3040'),
(172, 'KARAOKE ĐẢO XANH KTV', '26XF+MX9, Trần Thị Lý, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000FBC9181F660E5B408AB0E1E9950C3040'),
(173, 'A6 KARAOKE KTV CLUB', '35 Lý Thánh Tông, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000C404DAC2180F5B401488E82164123040'),
(174, 'Hawaii', '18 Phạm Văn Đồng, An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000B515A0127C0F5B408D69013510123040'),
(175, 'Karaoke Diamond 130 nguyễn văn thoại', '130 Nguyễn Văn Thoại, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000063B1F270A70F5B40D068064C3B0E3040'),
(176, 'Emma''s bar Da Nang', '36-38 An Thượng 8, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000004D599764AE0F5B409A6CF24A480C3040'),
(177, 'Crossroad Bar', '44 An Thượng 8, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000008266214BB00F5B40A9F34D3F4D0C3040'),
(178, '다낭 가라오케 VIP', 'Lô 25 Lý Thánh Tông, An Hải Bắc, Sơn Trà, Đà Nẵng 50409, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000565F025C350F5B407D4DC57C2F123040'),
(179, 'Dân Ca Karaoke', '31 Nguyễn Tri Phương, Thạc Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000054F135BA390D5B402A64F899C40E3040'),
(180, 'GOD Bar Lounge', '115 Hà Bổng, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000C37A489DA50F5B4061DD1DBEF1103040'),
(181, 'KARAOKE CAMEL 2', '7 Xuân Hòa 1, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000002593533B430C5B403526C45C52113040'),
(182, 'KARAOKE VICTORY KTV', '26XF+HQ4, Hòa Cường, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000FAB7CB7E5D0E5B40CFE2207C830C3040'),
(183, 'One More Craft Beer - Bia Thủ Công Đà Nẵng - 26 Quang Trung', '26 Quang Trung, Thạch Thang, Hải Châu, Đà Nẵng 50000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000597A7E622E0E5B40697D80A43E133040'),
(184, 'Mystery Bar & Lounge', '47 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000A62490B7810F5B40E7EE29EF99113040'),
(185, 'Karaoke Diamond', 'Tầng 2 du thuyền MARINA, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000A592F073B20E5B40053B59C576103040'),
(186, 'Sun karaoke', '445 Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000006C7BBB25B90E5B4037D263A593103040'),
(187, 'Roma premium lounge', '21 Nguyễn Cao Luyện, An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000002F4DB626820F5B40A84CD64DCE113040'),
(188, 'KaraokeBinbin', '103 - 105 Huy Cận, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000CAFACDC4F40D5B406CF8CC4873083040'),
(189, 'Big Bang Karaoke', '47 Chính Hữu, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000083C9E8DB5D0F5B40352ACB6B80113040'),
(190, 'Karaoke Lasvegas', 'Khu công viên Bắc Đài tưởng niệm, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000029024125530E5B40705D3123BC0B3040'),
(191, 'Morning Star Karaoke', '311 Lê Thanh Nghị, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000000CDCCBC7FF0D5B40CB82893F8A083040'),
(192, 'Karaoke Lan Rừng', '75 Lý Tự Trọng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000BBACD392D80D5B4019D06630A1133040'),
(193, 'Karaoke Uyên♥️🌸🌸', '206 Đ. Nguyễn Hoàng, Phước Ninh, Thanh Khê, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000006F4507C9A70D5B40BF7C57A9450F3040'),
(194, 'New Oriental Nightclub', '20 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000E20C5938240E5B40CBBFF11021153040'),
(195, 'X8 KTV KARAOKE', 'Số 2 Đinh Thị Hòa, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000EF642607220F5B40E8A793C72E123040'),
(196, 'Karaoke Gold', '115 Nguyễn Văn Thoại, An Hải Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000006E2CCD52570F5B408A9E4ABCF20D3040'),
(197, 'Karaoke Siêu Sao', '17 Châu Thị Vĩnh Tế, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000BC2B71D3550F5B408D64EA09A60D3040'),
(198, 'HeavenBar', '47 Ngô Thì Sĩ, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E610000048991E5EA10F5B40E63686A5260C3040'),
(199, 'NEW WORLD KTV - 뉴월드 가라오케', '262 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000C14FC186CC0F5B40C83956CE830E3040'),
(200, 'Karaoke Anh Ca', '01 Châu Thị Vĩnh Tế, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000CB619C64500F5B40E8908AB5AE0D3040'),
(201, 'Karaoke Gia Đình Lá Cọ', 'Đường Hòa Minh 2, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E61000005038BBB54C0A5B4094090962EA143040'),
(202, 'Kong 72 Speakeasy | Eat, Play, Love', '20 Mỹ Đa Đông 12, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'karaoke', -3, 'Google Places API', '0101000020E6100000D9EDB3CACC0F5B40D0CF7932A40B3040'),
(203, 'Medical Center Lien Chieu District', '525 Tôn Đức Thắng, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 55550, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000ACF82B09F5095B40A26DEB5D72103040'),
(204, 'Trạm Y tế phường Hải Châu 1', '239 Nguyễn Chí Thanh, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000D0B87020240E5B405A2FE12B15113040'),
(205, 'Trung tâm Y tế Quận Hải Châu - cs 2', '163 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000026D588AAA90D5B40D2A34EE559123040'),
(206, 'Hoa Tho Ward Clinics East', '28 Trần Ngọc Sương, Hòa Thọ Đông, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000693E42284A0C5B40BFAF366B95013040'),
(207, 'Trạm Y tế phường Khuê Trung', '68 Lương Văn Can, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000006357A4D3840D5B403299E08A7A053040'),
(208, 'Trạm Y tế phường Hòa Minh', '408 Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000044CB70F2910A5B40CE2A7D32100F3040'),
(209, 'Bệnh Viện Quân Y 17 - CHC - QK5', '3635+J7Q, Nguyễn Hữu Thọ, Hòa Thuận Nam, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000AC3C81B0530D5B4014C48A64D90D3040'),
(210, 'Trạm Y tế xã Hòa Phú', 'X3MF+XH9, Hoà Phú, Hòa Vang, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000009AF3E736BC045B40FA38E4B045F82F40'),
(211, 'Trạm Y Tế Phường Hòa Cường Bắc', '44 Trần Văn Giáp, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000FDE0D7A3CB0D5B400CF7DBE8AD093040'),
(212, 'Bệnh viện Đa khoa Tâm Trí Đà Nẵng', '64 Cách Mạng Tháng 8, Khuê Trung, Cẩm Lệ, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000062F316B4B50D5B40A75D4C33DD053040'),
(213, 'Trạm Y tế phường Hòa Cường Nam', '499 Núi Thành, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000005B9544F6410E5B40A1D80A9A96083040'),
(214, 'Hoa Khanh Ward Clinics North', '178 Âu Cơ, Hoà Khánh Bắc, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000004A95287B4B095B40D454055905123040'),
(215, 'Trạm Y Tế Phường Chính Gián', '104 Đ. Lê Độ, Chính Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000085573783E40C5B40DA7BA7B860113040'),
(216, 'Bệnh viện đa khoa Hải Châu', '38 Cao Thắng, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000063CED83CB30D5B4082B9275998133040'),
(217, 'Trạm Y tế phường Nại Hiên Đông', 'Nại Hiên Đông, Sơn Trà, Da Nang 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000005C678D8BB40E5B40C08C73E5FD153040'),
(218, 'Trung Tâm Y Tế Quận Sơn Trà Cơ Sở', '1063 Ng. Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000001A468B7D130F5B40EA25C632FD0E3040'),
(219, 'Sở Y Tế TP Đà Nẵng', '24 Trần Phú, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000A2DFADE2430E5B402FBFD364C6133040'),
(220, 'Trung tâm Y tế quận Cẩm Lệ', '105 Đ. Nguyễn Nhàn, Hòa Thọ Đông, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000009D01E43A7C0C5B40AFA4260BA9023040'),
(221, 'Trạm Y tế phường Xuân Hà', '114 Trần Cao Vân, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000E9BA4B3D660D5B401F37B2E19F123040'),
(222, 'Trạm Y tế phường Hòa Hiệp Nam', '913 Nguyễn Lương Bằng, Hoà Hiệp Nam, Liên Chiểu, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000103D29931A085B401F48DE39941B3040'),
(223, 'Health clinics Hoa Thuan Tay Ward', '26R5+WP9, Nguyễn Trác, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000BA4DB857660D5B40B2E8E797D20A3040'),
(224, 'Trạm Y tế phường Thanh Khê Đông', '868 Trần Cao Vân, Thanh Khê Đông, Thanh Khê, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000F72B5382B40B5B400491459A78113040'),
(225, 'Medical Center Thanh Khe District', '359Q+9W9, Kiệt 62 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000990F0874260C5B407B12D89C83113040'),
(226, 'Trạm Y tế xã Hòa Khương', 'X46R+G5H, Hoà Khương, Hòa Vang, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000005A3A30CAFD085B4094895B0531EC2F40'),
(227, 'Trạm Y tế phường Thanh Khê Đông', '3 Nguyễn Nghiêm, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000FCBDB964410C5B405C48765BD80F3040'),
(228, 'Trạm Y tế phường Thạch Thang', '8 Nguyễn Thị Minh Khai, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000000F33EA10EE0D5B403C461E2D73133040'),
(229, 'Trạm Y tế phường Bình Thuận', 'K371/4 Trưng Nữ Vương, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000008FE4F21FD20D5B4097FF907EFB0C3040'),
(230, 'Clinics Thanh Khe Tay Ward', '33 Mẹ Nhu, Thanh Khê Tây, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000D99EB4CB920B5B409D7D8A8807113040'),
(231, 'Trạm Y tế phường An Khê', '161 Trường Chinh, Hoà An, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000CFEE35A98D0B5B408C474ECBB40E3040'),
(232, 'Trạm Y tế phường Thạc Gián', '433 Lê Duẩn, Thạc Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000003A4479D4A0D5B401CEE23B726113040'),
(233, 'Trạm Y tế phường Hải Châu 2', '564 Ông Ích Khiêm, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000002220E23CE0D5B40BD2A61B719103040'),
(234, 'Trạm Y Tế Phường Hòa An', '119 Đoàn Hữu Trưng, Hoà An, Cẩm Lệ, Đà Nẵng 59000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000F4F8BD4D7F0B5B40D915E934C10C3040'),
(235, 'Trạm Y tế xã Hòa Tiến', 'X59J+P9G, ĐT605, Hoà Tiến, Hòa Vang, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000002B210EC8940B5B406AA09EE348F02F40'),
(236, 'Trạm Y tế phường Mỹ An', '4 Lưu Quang Thuận, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000007F5882CAD0F5B405B9FCD05890A3040'),
(237, 'Trạm Y tế xã Hòa Ninh', '333P+XQW, Đ. 602, Hoà Ninh, Hòa Vang, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000001B97169A90055B403E0801F9120E3040'),
(238, 'Trạm Y tế phường Thanh Bình', '51 Thanh Thủy, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000007D4D2036A20D5B4044A10A24CD143040'),
(239, 'Trung tâm Y tế quận Ngũ Hành Sơn', '582 Đ. Lê Văn Hiến, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000D1C952EB7D105B403B5E375B2F023040'),
(240, 'Trạm Y tế xã Hoà Sơn', '3495+W9W, Âu Cơ, Hoà Sơn, Hòa Vang, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000A96109B5F0065B40E0635529E2113040'),
(241, 'Trạm Y tế phường Hòa Phát', '630 Trường Chinh, Hoà Phát, Cẩm Lệ, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000E2E82ADDDD0B5B4086EBAC71910A3040'),
(242, 'Trạm Y tế phường Bình Thuận', '163 Trưng Nữ Vương, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000006AE7EA7D190E5B40A593B602540E3040'),
(243, 'Medical Center in Son Tra district', '1118 Ngô Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000026C05543070F5B40576F1E98ED0E3040'),
(244, 'Trạm Y Tế Phường An Hải Đông', '90 Nguyễn Duy Hiệu, An Hải Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000007B1C61AC4A0F5B40CF7C73243C0E3040'),
(245, 'Trạm Y Tế Phường Hòa Khánh Nam', '98 Hoàng Văn Thái, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000EFD1D160090A5B40D18778358A0E3040'),
(246, 'Trạm Y tế phường Phước Ninh', '439 Ông Ích Khiêm, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000008BD48B2D80D5B407ED3AA4CE70F3040'),
(247, 'Trạm Y tế phường Xuân Hà', '434 Trần Cao Vân, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000F0A485CBAA0C5B40D0F8742B3A123040'),
(248, 'Trạm Y tế phường Hòa Thọ Tây', '252M+28P, Đường số 3, Hoà Thọ Tây, Cẩm Lệ, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000007C22F4D8BB0B5B4068565B5606003040'),
(249, 'Trạm Y tế xã Hòa Liên', '33XW+58Q, ĐT601, Thôn Quan, Hòa Vang, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000EE618ACD22065B4084526AE514193040'),
(250, 'Trạm Y Tế Phường Thuận Phước', '10 Phan Kế Bính, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000820F6FE70C0E5B40DC2C5E2C0C153040'),
(251, 'Trạm Y tế phường Phước Ninh', '47 Hoàng Văn Thụ, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000353FA319300E5B4072C45A7C0A103040'),
(252, 'Trạm Y tế phường Khuê Mỹ', '26FX+QC3, Sen Hồng, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000000658F503E80F5B40E6CC76853E063040'),
(253, 'Trạm Y Tế Phường Hoà Hải', 'X7V4+FVC, Tây Sơn, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000B8301C1975105B406682E15CC3FC2F40'),
(254, 'Trạm Y tế phường Hòa Quý', 'X6PQ+2XQ, Mai Đăng Chơn, Hoà Quý, Ngũ Hành Sơn, Quảng Nam 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000009066D1E05B0F5B408ED02A8E5EF82F40'),
(255, 'Trạm Y Tế Phường An Hải Tây', '25 Nguyễn Thông, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000083D7D3B3C50E5B406987646DF8103040'),
(256, 'Trạm Y tế xã Hòa Châu', 'X5PX+WQ2, QL1A, Hoà Châu, Hòa Vang, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000091ED2186C20C5B40AA59B1097AF92F40'),
(257, 'Trung Tâm Y Tế Huyện Hoà Vang', '2552+JMF, Xã Hoà Thọ, Huyện Hòa Vang, Hoà Ninh, Hòa Vang, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000091ED7C3FB5095B406568E15751023040'),
(258, 'Trạm Y tế phường Mân Thái', '261 Ng. Quyền, Mân Thái, Sơn Trà, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000002F675B72810F5B40F7EF5586CC163040'),
(259, 'Trạm Y tế phường Thọ Quang', '36VX+2PV, Phan Bá Phiến, Thọ Quang, Sơn Trà, Đà Nẵng, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E6100000EE4916E6F30F5B4043194FA9B7173040'),
(260, 'Cam Thanh Commune Medical Center', 'V9H6+HW6, Thôn 4, Tp. Hội An, Quảng Nam, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000008857A3682F175B4011233ABA00C22F40'),
(261, 'Hello Doctor', '14 Lê Doãn Nhạ, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E610000027439FD9BF095B40CFE3E60AA5113040'),
(262, 'Trạm Y tế phường An Hải Bắc', '127 Đ. Nguyễn Trung Trực, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 'hospital_clinic', 8, 'Google Places API', '0101000020E61000009ECA0E96D60E5B402354049376143040'),
(263, 'Thanh Khê Ward People''s Committee', '503 Trần Cao Vân, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E61000008F4E02403A0C5B40554D10751F123040'),
(264, 'Ngũ Hành Sơn Ward People''s Committee', '486 Đ. Lê Văn Hiến, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000A56ABB093E105B404CF1023631043040'),
(265, 'People''s Committee of Hải Châu Ward', '76 Ông Ích Khiêm, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E61000009DFCCC0F920D5B40CE339B6CA8133040'),
(266, 'Thuận Phước Ward People''s Committee', '88 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000E1534A19020E5B40C72C7B12D8143040'),
(267, 'Hòa Vang District People''s Committee', 'X4QQ+CMQ, Hoà Phong, Hòa Vang, Đà Nẵng, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000BED3090DE9085B406E426B8F28FA2F40'),
(268, 'Hòa Hiệp Nam Ward People''s Committee', '2 Nguyễn Tất Thành, Hoà Hiệp Nam, Liên Chiểu, Đà Nẵng, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000A076AEDE17085B40826D69DA6A1B3040'),
(269, 'Hòa Thọ Tây Ward People''s Committee', 'Cầu Đỏ, Túy Loan, Hoà Thọ Tây, Cẩm Lệ, Đà Nẵng, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E61000009283C8D8BF0B5B40295FD04202003040'),
(270, 'UBND Phường Hải Vân', '20 Nguyễn Phước Chu, Hoà Hiệp Bắc, Liên Chiểu, Đà Nẵng, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000D475F233BF075B401BD423B2B4203040'),
(271, 'People''s Court of Đà Nẵng', '374 Núi Thành, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000DE509DB32A0E5B40F146E6913F0A3040'),
(272, 'Thành ủy Đà Nẵng', '72 Bạch Đằng, Hải Châu, Đà Nẵng 550000, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E61000004908A062660E5B404048BB760E123040'),
(273, 'Nhà Sinh Hoạt Cộng Đồng (Ủy Ban Nhân Dân Phường Hòa Hải)', '2764+WRQ, Đ. Nguyễn Xiển, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000D61BB5C274105B4092D6CEE627033040'),
(274, 'Danang Department of Home Affair', '24 Trần Phú, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E61000008C78FC28340E5B4083DA1434D2133040'),
(275, 'Quận ủy Hải Châu', '76 Quang Trung, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 'government_office', 5, 'Google Places API', '0101000020E6100000C2172653050E5B405734E72A27133040'),
(276, 'Cảnh sát Phòng cháy và Chữa cháy Tp. Đà Nẵng', 'Cảnh sát PCCC, 183 Phan Đăng Lưu, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 'fire_station', 7, 'Google Places API', '0101000020E6100000C5162763A10D5B403DA6A43D14093040'),
(277, 'Cảnh sát PCCC Và CNCH quận Hải Châu', '181a Phan Đăng Lưu, Hoà Cường Nam, Hải Châu, Đà Nẵng 550000, Vietnam', 'fire_station', 7, 'Google Places API', '0101000020E6100000FA298E03AF0D5B403EF7D4A01E093040'),
(278, 'Sở Cảnh Sát Phòng Cháy Chữa Cháy', '612 Nguyễn Hữu Thọ, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'fire_station', 7, 'Google Places API', '0101000020E6100000F060D56A590D5B404D32CDCF68063040'),
(279, 'Đội Cảnh sát Phòng Cháy & Chữa Cháy Ngũ Hành Sơn', '2792+C45, Nguyễn Đức Thuận, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 'fire_station', 7, 'Google Places API', '0101000020E6100000F01C250A08105B4048B368F0AD043040'),
(280, 'Đội Chữa cháy và CNCH - Khu vực 5', 'Trần Nam Trung, Hoà Xuân, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'fire_station', 7, 'Google Places API', '0101000020E6100000FC259820D90D5B400296010C70003040'),
(281, 'Phòng Cảnh sát PC&CC Số 2', '210 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 'fire_station', 7, 'Google Places API', '0101000020E61000005A44B9D9440C5B40E61A0BAFC90F3040'),
(282, 'Phòng Cảnh Sát Phòng Cháy Chữa Cháy Số 2', '2 Hà Huy Tập, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 'fire_station', 7, 'Google Places API', '0101000020E61000009453967C470C5B40F17D16F0D7113040'),
(283, 'Bến Xe Khách Đà Nẵng', '354F+C65, Hoà An, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E6100000BAC788FA130B5B40F785A11F570E3040'),
(284, 'Bến xe trung tâm Đà Nẵng', 'Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E6100000D184DCFB0A0B5B409808652B790E3040'),
(285, 'Da Nang Southern Intercity Bus Terminal (DLGL Group)', 'X696+3GH, QL1A, Hoà Phước, Hòa Vang, Đà Nẵng, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E61000008B7159E0860D5B40EE04FBAF73EF2F40'),
(286, 'Bến xe Đức Long phía nam', 'QL1A, Hoà Phước, Hòa Vang, Đà Nẵng, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E61000006B8EBD288B0D5B406578A2DA96EF2F40'),
(287, 'Danang Central Bus Station Taxi Stand', '2duong Đ.Đàm Văn Lễ, Hoà An, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E6100000C50A6DEF090B5B40A53E7F901B0E3040'),
(288, 'Da Nang Bus Station', '201 Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E6100000A76153420B0B5B4085F70B2C360E3040'),
(289, 'Nhà gửi xe Bến xe trung tâm Đà Nẵng', 'Xe Trung Tâm, Bến, Tôn Đức Thắng, Hoà Minh, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E6100000167EBACB0F0B5B40A1DD7C7E730E3040'),
(290, 'Bến Xe Đà Nẵng', 'Hòa Minh, Cẩm Lệ District, Da Nang 550000, Vietnam', 'bus_station', -4, 'Google Places API', '0101000020E61000004E8FB7A60A0B5B40512855EC790E3040');

--
-- Data for Name: safety_points_staging; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.safety_points_staging (ten_diem, dia_chi, kinh_do, vi_do, loai_diem, diem_trong_so, nguon_du_lieu) VALUES
('Danang Professional Training College', '99 Tô Hiến Thành, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2436467, 16.0598773, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Phương Đông Đà Nẵng', '32 Phan Đăng Lưu, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Vietnam', 108.2211404, 16.0375833, 'university_college', 3, 'Google Places API'),
('Danang Vocational Tourism College', 'Nam Kỳ Khởi Nghĩa, Tổ 69, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2577007, 15.9771443, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Kinh tế - Kế hoạch Đà Nẵng', '143 Nguyễn Lương Bằng, Phường, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1483958, 16.0763608, 'university_college', 3, 'Google Places API'),
('Trường Cao Đẳng Công Nghệ Y Dược Việt Nam - Đà Nẵng', 'Phòng tuyển sinh y dược, 116 Nguyễn Huy Tưởng, Hoà An, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1697784, 16.0519181, 'university_college', 3, 'Google Places API'),
('Đại Việt Danang College', '65 Nguyễn Lộ Trạch, Hoà Cường Nam, Hải Châu, Đà Nẵng 552478, Vietnam', 108.2284051, 16.03228, 'university_college', 3, 'Google Places API'),
('College of IT Danang University', 'Đường Nam Kỳ Khởi Nghĩa Lưu Quang Vũ, Làng Đại học, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2496691, 15.9721894, 'university_college', 3, 'Google Places API'),
('Vietnam - Korea University of Information and Communication Technology', '470 Trần Đại Nghĩa, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.253227, 15.9752603, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Văn hóa Nghệ thuật Đà Nẵng', '130 Lê Quang Đạo, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2459327, 16.0474193, 'university_college', 3, 'Google Places API'),
('Trường Cao Đẳng Bách Khoa Đà Nẵng', '271 Tố Hữu, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2105869, 16.0332768, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Lạc Việt', '42-46 Phan Châu Trinh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2200525, 16.0676797, 'university_college', 3, 'Google Places API'),
('College transport 2', '28 Ngô Xuân Thu, Hoà Hiệp Bắc, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1180282, 16.1221829, 'university_college', 3, 'Google Places API'),
('University of Economics - The University of Đà Nẵng', '71 Ngũ Hành Sơn, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2394734, 16.0473935, 'university_college', 3, 'Google Places API'),
('Trường Cao Đẳng Đà Nẵng (cơ sở 3)', 'Mai Đăng Chơn, Hoà Quý, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 108.2301137, 15.9646083, 'university_college', 3, 'Google Places API'),
('Trường cao đẳng Lương Thực Thực Phẩm', '101B Lê Hữu Trác, P.An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2413485, 16.0592137, 'university_college', 3, 'Google Places API'),
('University of Technology and Education - University of Đà Nẵng', '48 Cao Thắng, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2134243, 16.0773428, 'university_college', 3, 'Google Places API'),
('Trường Cao Đẳng Quốc Tế Pegasus Đà Nẵng', 'Vùng Trung 3, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2601162, 15.9899976, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Thương mại', '45 Đ. Dũng Sĩ Thanh Khê, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1784223, 16.0719587, 'university_college', 3, 'Google Places API'),
('Dong A University', '33 Xô Viết Nghệ Tĩnh, Hòa Cường, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2213025, 16.0320289, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Công nghệ Ngoại Thương', '46 đường phan châu trinh, phường Hải châu 1, Đà Nẵng, 50000, Vietnam', 108.2201511, 16.0676438, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Nghề Nguyễn Văn Trỗi', '69 Đoàn Hữu Trưng, Hoà An, Cẩm Lệ, Đà Nẵng 59000, Vietnam', 108.1787234, 16.0523034, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng Hoa Sen', 'Q, 39 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 50307, Vietnam', 108.1917947, 16.0686808, 'university_college', 3, 'Google Places API'),
('Đại học Đà Nẵng', '41 Lê Duẩn, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2201228, 16.0710251, 'university_college', 3, 'Google Places API'),
('Da Nang University of Medical Technology and Pharmacy', '99 Hùng Vương, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2184675, 16.0674886, 'university_college', 3, 'Google Places API'),
('Da Nang University of Science and Technology', '54 Nguyễn Lương Bằng, Hoà Khánh Bắc, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.149869, 16.0736606, 'university_college', 3, 'Google Places API'),
('Cao Đẳng Anh Quốc BTEC FPT', '66 Võ Văn Tần, Chính Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2027703, 16.067156, 'university_college', 3, 'Google Places API'),
('Danang Architecture University', '566 Núi Thành, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.2220601, 16.0321875, 'university_college', 3, 'Google Places API'),
('University of Science and Education - The University of Danang', '459 Tôn Đức Thắng, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.159124, 16.0616474, 'university_college', 3, 'Google Places API'),
('University of Foreign Language Studies - University of Đà Nẵng', '131 Lương Nhữ Hộc, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2116631, 16.0345824, 'university_college', 3, 'Google Places API'),
('School of medicine and pharmacy – The university of danang', 'Đ. Lưu Quang Vũ, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2480164, 15.9737946, 'university_college', 3, 'Google Places API'),
('Campus in Da Nang of MUCE', '544 B Nguyễn Lương Bằng, Hoà Hiệp Nam, Liên Chiểu, Đà Nẵng, Vietnam', 108.1364941, 16.1009092, 'university_college', 3, 'Google Places API'),
('Trường Cao đẳng CNTT Chuyên Nghiệp', '92 Quang Trung, Thạch Thang, Hải Châu, Đà Nẵng 50255, Vietnam', 108.2184885, 16.0746507, 'university_college', 3, 'Google Places API'),
('Cao đẳng fpt', '260 Hải Phòng, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2068283, 16.0705992, 'university_college', 3, 'Google Places API'),
('Phổ thông Cao đẳng FPT Polytechnic Đà Nẵng', '137 Đường Nguyễn Thị Thập, Thanh Khê Tây, Liên Chiểu, Đà Nẵng, Vietnam', 108.16996, 16.0757256, 'university_college', 3, 'Google Places API'),
('Da Nang City Police', '80 Lê Lợi, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.219471, 16.077076, 'police_station', 15, 'Google Places API'),
('Đồn Công An Xuất Nhập Cảnh', '3643+J5J, Hòa Thuận Tây, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2028916, 16.0565832, 'police_station', 15, 'Google Places API'),
('Đồn Công an phường Xuân Hà', '48 Xuân Đán 1, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1939907, 16.0694974, 'police_station', 15, 'Google Places API'),
('Da Nang City Investigation Police Agency Office', '47 Lý Tự Trọng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2195121, 16.0768213, 'police_station', 15, 'Google Places API'),
('Phòng Cảnh sát Cơ động - Công an Thành phố Đà Nẵng', '150 Đà Sơn, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1571988, 16.046503, 'police_station', 15, 'Google Places API'),
('Thanh Khe District Police', '324 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1865747, 16.0596444, 'police_station', 15, 'Google Places API'),
('Phòng CSGT - Công an TP Đà Nẵng', '77 Võ An Ninh, Hoà Xuân, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2175187, 16.0076641, 'police_station', 15, 'Google Places API'),
('Công an quận Cẩm Lệ', '2683+Q9P, Cách Mạng Tháng 8, Hòa Thọ Đông, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2034789, 16.0169004, 'police_station', 15, 'Google Places API'),
('Công an quận Sơn Trà', '36CM+2CQ, Huy Du, An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2335753, 16.0700863, 'police_station', 15, 'Google Places API'),
('Police Hoa Cuong Nam Ward', '561 Núi Thành, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.2230319, 16.0315685, 'police_station', 15, 'Google Places API'),
('Công an phường Thanh Khê Đông', '739 Trần Cao Vân, Thanh Khê Đông, Thanh Khê, Đà Nẵng, Vietnam', 108.1830897, 16.0680994, 'police_station', 15, 'Google Places API'),
('Báo Công an Thành phố Đà Nẵng', '62 Phan Châu Trinh, Hải Châu, Đà Nẵng 50206, Vietnam', 108.2200751, 16.0670468, 'police_station', 15, 'Google Places API'),
('Ngu Hanh Son district police', '492 Đ. Lê Văn Hiến, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2546261, 16.0148714, 'police_station', 15, 'Google Places API'),
('Công An Phường An Khê', '394 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1815232, 16.0571813, 'police_station', 15, 'Google Places API'),
('Công an phường Sơn Trà', '37 Đ. Trần Hưng Đạo, Nại Hiên Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2290778, 16.0830268, 'police_station', 15, 'Google Places API'),
('TOP TV Club', '26VF+MFR, Khu Bắc tượng đài, Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2235784, 16.04424, 'nightlife_bar', -7, 'Google Places API'),
('New Oriental Nightclub', '20 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2209607, 16.0825358, 'nightlife_bar', -7, 'Google Places API'),
('ADM CLUB', 'Khu công viên Bắc Đài tưởng niệm, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50000, Vietnam', 108.2239182, 16.0458487, 'nightlife_bar', -7, 'Google Places API'),
('The Roof - Da Nang', '1a Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2460466, 16.06753, 'nightlife_bar', -7, 'Google Places API'),
('For You Club', '52-55 Trần Văn Trứ, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2227304, 16.0566025, 'nightlife_bar', -7, 'Google Places API'),
('OQ Club', '18-20 Bạch Đằng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2236413, 16.0795722, 'nightlife_bar', -7, 'Google Places API'),
('Sugar Social Club', '100 Yên Bái, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2223219, 16.0656756, 'nightlife_bar', -7, 'Google Places API'),
('Koto Club Da Nang', '254 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2463825, 16.0595883, 'nightlife_bar', -7, 'Google Places API'),
('Karma Lounge Da Nang', '6 Trần Quốc Toản, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2240377, 16.0662114, 'nightlife_bar', -7, 'Google Places API'),
('Hair Of The Dog Bar Danang', '06 Trần Quốc Toản, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2240467, 16.0662007, 'nightlife_bar', -7, 'Google Places API'),
('Sky36', '36 Bạch Đằng, Street, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2238351, 16.0771856, 'nightlife_bar', -7, 'Google Places API'),
('Malibu Beach Club - Seaside Chill & Cocktails', 'Bãi tắm, Đường võ nguyên giáp/3 Phạm Văn Đồng, Nằm khu vực bãi tắm, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2459617, 16.0738737, 'nightlife_bar', -7, 'Google Places API'),
('Điểm Nóng+ Eat, Drink & Music', '37 Nguyễn Tri Phương, Thạc Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.206856, 16.0573499, 'nightlife_bar', -7, 'Google Places API'),
('Kết High', '200 Bạch Đằng, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2241352, 16.0654566, 'nightlife_bar', -7, 'Google Places API'),
('Sky 21 Bar & Bistro', 'Parosand Danang Hotel, 216 Đường võ nguyên giáp, phường An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2447822, 16.0676056, 'nightlife_bar', -7, 'Google Places API'),
('Bar Đồ Yêu - Authentic Vietnamese Cocktail', '87 Hoàng Văn Thụ, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2195163, 16.0628839, 'nightlife_bar', -7, 'Google Places API'),
('NYX Sky Lounge & Mixology', '182 Bạch Đằng, Street, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2244388, 16.0661803, 'nightlife_bar', -7, 'Google Places API'),
('On The Radio Bar', '76 Thái Phiên, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2213507, 16.0652451, 'nightlife_bar', -7, 'Google Places API'),
('The 1920''s Lounge', '53 Trần Quốc Toản, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2219325, 16.0661971, 'nightlife_bar', -7, 'Google Places API'),
('Sophie Lounge - Bar', '150 Bạch Đằng, Hải Châu, Đà Nẵng 50000, Vietnam', 108.2246963, 16.0670125, 'nightlife_bar', -7, 'Google Places API'),
('Hybrid Sports Lounge: Watch | Play | Dine', '26 Đỗ Bá, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2459367, 16.0517899, 'nightlife_bar', -7, 'Google Places API'),
('New Golden Pine Pub', '325 Đ. Trần Hưng Đạo, An Hải Bắc, Sơn Trà, Đà Nẵng 590000, Vietnam', 108.2290869, 16.0742601, 'nightlife_bar', -7, 'Google Places API'),
('Bamboo 2 Bar', '216 Bạch Đằng, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2240158, 16.0649822, 'nightlife_bar', -7, 'Google Places API'),
('C Bar', '100 Lê Quang Đạo, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2458861, 16.0485863, 'nightlife_bar', -7, 'Google Places API'),
('New 92 Club - Night Club Hoi An', 'Bờ Hồ 1, Cẩm Hà, Hội An, Quảng Nam, Vietnam', 108.3179925, 15.8960077, 'nightlife_bar', -7, 'Google Places API'),
('NEW 212 CLUB', 'DMT MARINA CORP, Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2296416, 16.064325, 'nightlife_bar', -7, 'Google Places API'),
('Monaco Club ( Quán Bar - Vũ Trường)', '91 Đ. Lý Thái Tổ, Tân Lợi, Buôn Ma Thuột, Đắk Lắk 630000, Vietnam', 108.0590453, 12.6986567, 'nightlife_bar', -7, 'Google Places API'),
('EAZY D', '72-74 Hùng Vương, Hải Châu, Đà Nẵng 50000, Vietnam', 108.2230401, 16.0687187, 'nightlife_bar', -7, 'Google Places API'),
('Boss Bar Lounge', '178 Phạm Văn Đồng, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.236875, 16.0702536, 'nightlife_bar', -7, 'Google Places API'),
('BUNNY Bar & Lounge 2', '12 Nguyễn Du, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.22168, 16.078915, 'nightlife_bar', -7, 'Google Places API'),
('Regency Club Lounge', '5 Trường Sa, Street, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2639447, 16.0129552, 'nightlife_bar', -7, 'Google Places API'),
('Vip Club', '17 Quang Trung, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2217854, 16.0750228, 'nightlife_bar', -7, 'Google Places API'),
('Trong Dong Dance Hall', '9 Đ. 2 Tháng 9, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.2237964, 16.032286, 'nightlife_bar', -7, 'Google Places API'),
('K-MART', '432/14 Võ Nguyên Giáp, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2490568, 16.0405413, 'convenience_store', 4, 'Google Places API'),
('G’Local Mart & Cafe', 'Lô 4 - A3.5, Khu Đảo Xanh, Phường Hoà Cường Bắc, Hòa Cường, Đà Nẵng, 500000, Vietnam', 108.2248095, 16.0491213, 'convenience_store', 4, 'Google Places API'),
('Gimme Mart 24h Convenience Store', '89 An Thượng 29, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2441268, 16.0514683, 'convenience_store', 4, 'Google Places API'),
('ONE STOP - 24/7 Convenience, Drinks, Eats & Specialties', '35 Trần Bạch Đằng, Phường An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2453145, 16.0576544, 'convenience_store', 4, 'Google Places API'),
('V+ Mini Mart 24/7', '01 Trần Quốc Toản, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2241951, 16.0659141, 'convenience_store', 4, 'Google Places API'),
('Oh! Mart Đà Nẵng - Cửa hàng tiện lợi 24/7', '271 Hồ Nghinh, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2433619, 16.0659982, 'convenience_store', 4, 'Google Places API'),
('PK Mart cửa hàng tiện lợi 24/7', '36-38 đường An Thượng 26, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 50000, Vietnam', 108.2450748, 16.0552626, 'convenience_store', 4, 'Google Places API'),
('Vie Mart - 96 Trịnh Công Sơn', '96 Trịnh Công Sơn, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.2204868, 16.0330884, 'convenience_store', 4, 'Google Places API'),
('V+ Mini Mart 24/7', '147 Đ. Trần Hưng Đạo, Nại Hiên Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2291275, 16.0795826, 'convenience_store', 4, 'Google Places API'),
('DRAGON Mart & Cafe 24h', 'A30 Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2305351, 16.0625373, 'convenience_store', 4, 'Google Places API'),
('Cửa hàng tiện lợi KENKIN', '26PV+279, Khuê Mỹ, Ngũ Hành Sơn, Da Nang, Vietnam', 108.2432127, 16.0350209, 'convenience_store', 4, 'Google Places API'),
('Mini mart: Đặc sản miền Trung-Cửa hàng tiện lợi', '23 Võ Văn Kiệt, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2446181, 16.0634635, 'convenience_store', 4, 'Google Places API'),
('Full-Market', '247 Đ. Lê Văn Hiến, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 50000, Vietnam', 108.2560148, 16.0130993, 'convenience_store', 4, 'Google Places API'),
('Nov.Mart 24/7', '45 Hà Bổng, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2443269, 16.0677163, 'convenience_store', 4, 'Google Places API'),
('Cửa hàng tiện lợi S8 Mart', '58 Lý Thái Tông, Thanh Khê Tây, Đà Nẵng, 50000, Vietnam', 108.1753039, 16.0747449, 'convenience_store', 4, 'Google Places API'),
('Cửa Hàng VPP Hồng Hà', '82 Thái Phiên, Phường Minh An, Hội An, Quảng Nam, Vietnam', 108.3275943, 15.8818167, 'convenience_store', 4, 'Google Places API'),
('Soco Mart 247', '48 Lê Đình Dương, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2208254, 16.0613933, 'convenience_store', 4, 'Google Places API'),
('Cửa Hàng Tiện Lợi Nmart', 'K79, 14 Lê Hữu Trác, An Hải Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.240165, 16.0591896, 'convenience_store', 4, 'Google Places API'),
('Mart-Kikimo', '46 Ngô Thì Sĩ, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2449211, 16.0474792, 'convenience_store', 4, 'Google Places API'),
('Full-Market', '225 Hoàng Kế Viêm, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2472161, 16.0496874, 'convenience_store', 4, 'Google Places API'),
('Hello mart ( cửa hàng tiện lợi )', '30 Lâm Hoành, Phước Mỹ, Sơn Trà, Đà Nẵng 50000, Vietnam', 108.2452738, 16.0623401, 'convenience_store', 4, 'Google Places API'),
('Nina mart cửa hàng tiện lợi', 'An Đồn 6, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2378101, 16.0714832, 'convenience_store', 4, 'Google Places API'),
('D''Mart', '5 Lê Hồng Phong, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2229452, 16.0637637, 'convenience_store', 4, 'Google Places API'),
('Cửa hàng tiện lợi 24h - 2! Mart', '379B Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1643151, 16.0590054, 'convenience_store', 4, 'Google Places API'),
('Cửa hàng tiện lợi 24h - 2! Mart - 84 Kinh Dương Vương', '84 Kinh Dương Vương, Thanh Khê Tây, Liên Chiểu, Đà Nẵng, Vietnam', 108.1719081, 16.0733388, 'convenience_store', 4, 'Google Places API'),
('Cửa Hàng Tiện Lợi Good Mart', '207 Lê Quang Đạo, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2462268, 16.0483171, 'convenience_store', 4, 'Google Places API'),
('D''Mart', '80 Trần Phú, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2237351, 16.0697617, 'convenience_store', 4, 'Google Places API'),
('D''Mart & More - 19 Trần Quốc Toản', '19 Trần Quốc Toản, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2232639, 16.0660215, 'convenience_store', 4, 'Google Places API'),
('V+ Mini Mart 24/7', '193 Nguyễn Văn Linh, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2140048, 16.0600609, 'convenience_store', 4, 'Google Places API'),
('SPEED L Đà Nẵng', '6 Nại Nam, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2291333, 16.0348318, 'convenience_store', 4, 'Google Places API'),
('WinMart+', '112 Nguyễn Duy Hiệu, Cẩm Châu, Hội An, Quảng Nam, Vietnam', 108.3489601, 15.881701, 'convenience_store', 4, 'Google Places API'),
('Full-Market', 'Lô 39 Bùi Tá Hán, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 108.239886, 16.0288923, 'convenience_store', 4, 'Google Places API'),
('Nina Mart', '114 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2455756, 16.0781697, 'convenience_store', 4, 'Google Places API'),
('Cửa hàng tiện lợi Aauminimart', '236 Trần Bạch Đằng, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2475816, 16.0493404, 'convenience_store', 4, 'Google Places API'),
('CENTERBOX & MART - Siêu Thị Tiện Lợi 247 & Karaoke Box Music', '97 Ngô Tất Tố, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50153, Vietnam', 108.2168366, 16.0368923, 'convenience_store', 4, 'Google Places API'),
('LEE 24/7 CONVENIENCE STORE', '39 Thái Phiên, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2221713, 16.0649426, 'convenience_store', 4, 'Google Places API'),
('T-MARKET', '220 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2448345, 16.0673301, 'convenience_store', 4, 'Google Places API'),
('Vini Minimart', 'V8GG+9H5, Nguyễn Phúc Chu, Phường Minh An, Hội An, Quảng Nam, Vietnam', 108.3264605, 15.8758773, 'convenience_store', 4, 'Google Places API'),
('OKO mart', '152 Trần Bạch Đằng, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2462882, 16.0537814, 'convenience_store', 4, 'Google Places API'),
('OKONO', '180 Đỗ Bá, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.240423, 16.0502023, 'convenience_store', 4, 'Google Places API'),
('V+ Mini Mart 24/7', '36 Mỹ Khê 4, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2456219, 16.0569334, 'convenience_store', 4, 'Google Places API'),
('MART43', '89 Đỗ Bá, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.243744, 16.0509156, 'convenience_store', 4, 'Google Places API'),
('Winmart+ 296 Nguyễn Hoàng', '296 Đ. Nguyễn Hoàng, Phước Ninh, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2129609, 16.057465, 'convenience_store', 4, 'Google Places API'),
('AB Mart', '06 Hoàng Dư Khương, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2133506, 16.0274686, 'convenience_store', 4, 'Google Places API'),
('GOPI MART - Phan Thành Tài', '37 Phan Thành Tài, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2204819, 16.0539401, 'convenience_store', 4, 'Google Places API'),
('Mart & More', '181 - 183 Hồ Nghinh, Phước Mỹ, Sơn Trà, Đà Nẵng 50000, Vietnam', 108.2433347, 16.0680945, 'convenience_store', 4, 'Google Places API'),
('Cửa hàng tiện lợi', '75 Trần Đình Đàn, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2449511, 16.0787593, 'convenience_store', 4, 'Google Places API'),
('Ninamart', '14 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 108.221589, 16.082709, 'convenience_store', 4, 'Google Places API'),
('Sun mini.mart', '02 Vương Thừa Vũ, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2460826, 16.0801766, 'convenience_store', 4, 'Google Places API'),
('GOPI MART - Đường 2 Tháng 9', '252 Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2225668, 16.0457837, 'convenience_store', 4, 'Google Places API'),
('N Mart', '209 Nguyễn Duy Hiệu, Cẩm Châu, Hội An, Quảng Nam, Vietnam', 108.3381462, 15.8782772, 'convenience_store', 4, 'Google Places API'),
('HELLO MART', '48 Đường võ nguyên giáp, Mân Thái, Sơn Trà, Đà Nẵng, Vietnam', 108.2481728, 16.0856795, 'convenience_store', 4, 'Google Places API'),
('MOONMILK Market', '112 Lê Quang Đạo, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2459192, 16.0484821, 'convenience_store', 4, 'Google Places API'),
('Auminimart 7', '45 Hà Bổng, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2444251, 16.0677263, 'convenience_store', 4, 'Google Places API'),
('Full Market 24h', 'Đối Diện, 04 Trần Quang Diệu, An Hải Tây, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2334604, 16.0546593, 'convenience_store', 4, 'Google Places API'),
('ICHI MART', '184 Trần Phú, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2234633, 16.0653189, 'convenience_store', 4, 'Google Places API'),
('SOCOmart', 'Tầng hầm, 305 Nguyễn Văn Thoại, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2446547, 16.0559372, 'convenience_store', 4, 'Google Places API'),
('Siêu Thị Mini 24/7 ARES MART CS2', '23 Nguyễn Hữu Thọ, Hòa Thuận Nam, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2086186, 16.0555097, 'convenience_store', 4, 'Google Places API'),
('Sontra mini Mart 24h', 'Lô 41 Hoàng Sa, Thọ Quang, Sơn Trà, Đà Nẵng, Vietnam', 108.2545805, 16.0994404, 'convenience_store', 4, 'Google Places API'),
('Tạp hoá Leo', '61b Đ. Phạm Như Xương, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.154717, 16.0633728, 'convenience_store', 4, 'Google Places API'),
('Queen Palace Karaoke Đà Nẵng', '179 Xô Viết Nghệ Tĩnh, Phường, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.209973, 16.0311757, 'karaoke', -3, 'Google Places API'),
('Karaoke Box Music ( Phòng Hát Mini - FIUSOUND)', '160/17 Đ. Nguyễn Hoàng, Phước Ninh, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2130473, 16.061326, 'karaoke', -3, 'Google Places API'),
('PREMIER LOUNGE', '62 Nguyễn Xuân Khoát, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.236246, 16.0701609, 'karaoke', -3, 'Google Places API'),
('다낭 가라오케 NEW 에덴 가라오케', '05 Duy Tân, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2162024, 16.0484272, 'karaoke', -3, 'Google Places API'),
('ROYAL Karaoke Club', '308 Nguyễn Hữu Thọ, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2095998, 16.0361403, 'karaoke', -3, 'Google Places API'),
('GINZA Bar & Lounge', '9 Phan Bội Châu, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.221498, 16.0799157, 'karaoke', -3, 'Google Places API'),
('Karaoke Sương Chiều', '3 Thanh Thủy, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2124252, 16.0798624, 'karaoke', -3, 'Google Places API'),
('Karaoke RETRO', '175 Phùng Hưng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1664162, 16.0728106, 'karaoke', -3, 'Google Places API'),
('Karaoke Louis - 46 Ngô Văn Sở', '46 Ngô Văn Sở, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1498503, 16.0687881, 'karaoke', -3, 'Google Places API'),
('YOKO Bar & Lounge', '111 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2385996, 16.0685972, 'karaoke', -3, 'Google Places API'),
('TinTin KTV karaoke & Bar', '13 Khuê Mỹ Đông 1, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng 50000, Vietnam', 108.2446798, 16.0367022, 'karaoke', -3, 'Google Places API'),
('Karaoke Wonder', '133A Nguyễn Tất Thành, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2131717, 16.083047, 'karaoke', -3, 'Google Places API'),
('Royal karaoke', '288 Kinh Dương Vương, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1652115, 16.0777563, 'karaoke', -3, 'Google Places API'),
('Junco Karaoke', '441 Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2300505, 16.0647529, 'karaoke', -3, 'Google Places API'),
('YUMI Counter & Lounge', '187 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2373139, 16.0688968, 'karaoke', -3, 'Google Places API'),
('K Box - Recording and Mart 🎤', '319 Lê Thanh Nghị, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.218798, 16.0329256, 'karaoke', -3, 'Google Places API'),
('Karaoke Melody Elementary La', '113 Tiểu La, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2186239, 16.0453886, 'karaoke', -3, 'Google Places API'),
('다낭 가라오케 업타운 UP TOWN', '54 Võ Nghĩa, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2441126, 16.0723896, 'karaoke', -3, 'Google Places API'),
('Karaoke Night Club', '33 Bàu Trảng 3, Thanh Khê Tây, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1810591, 16.064886, 'karaoke', -3, 'Google Places API'),
('Karaoke Phương Trí', '90/2 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.191633, 16.0674619, 'karaoke', -3, 'Google Places API'),
('KARAOKE SONIC', '67 Đ. Nguyễn Tường Phổ, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1706941, 16.0619843, 'karaoke', -3, 'Google Places API'),
('ADM CLUB', 'Khu công viên Bắc Đài tưởng niệm, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50000, Vietnam', 108.2239182, 16.0458487, 'karaoke', -3, 'Google Places API'),
('Home Lounge & Bar', '34 Nguyễn Chí Thanh, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2202998, 16.0763812, 'karaoke', -3, 'Google Places API'),
('Karaoke Idol - Đà Nẵng', '184 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2173038, 16.0789127, 'karaoke', -3, 'Google Places API'),
('Karaoke Song Ca', '1 An Thượng 21, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2391258, 16.0533961, 'karaoke', -3, 'Google Places API'),
('Karaoke Tieng To Dong', '15 Phan Thành Tài, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2214679, 16.0536511, 'karaoke', -3, 'Google Places API'),
('BLANK Lounge & Bar', '223 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2365567, 16.0692156, 'karaoke', -3, 'Google Places API'),
('Las Vegas Karaoke', '26WF+CGG, Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2238247, 16.0458406, 'karaoke', -3, 'Google Places API'),
('TOP TV Club', '26VF+MFR, Khu Bắc tượng đài, Đ. 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2235784, 16.04424, 'karaoke', -3, 'Google Places API'),
('KARAOKE ĐẢO XANH KTV', '26XF+MX9, Trần Thị Lý, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.224983, 16.0491625, 'karaoke', -3, 'Google Places API'),
('A6 KARAOKE KTV CLUB', '35 Lý Thánh Tông, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2358863, 16.0718404, 'karaoke', -3, 'Google Places API'),
('Hawaii', '18 Phạm Văn Đồng, An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2419478, 16.0705598, 'karaoke', -3, 'Google Places API'),
('Karaoke Diamond 130 nguyễn văn thoại', '130 Nguyễn Văn Thoại, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2445948, 16.0555923, 'karaoke', -3, 'Google Places API'),
('Emma''s bar Da Nang', '36-38 An Thượng 8, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2450191, 16.0479781, 'karaoke', -3, 'Google Places API'),
('Crossroad Bar', '44 An Thượng 8, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2451351, 16.0480537, 'karaoke', -3, 'Google Places API'),
('다낭 가라오케 VIP', 'Lô 25 Lý Thánh Tông, An Hải Bắc, Sơn Trà, Đà Nẵng 50409, Vietnam', 108.2376318, 16.0710371, 'karaoke', -3, 'Google Places API'),
('Dân Ca Karaoke', '31 Nguyễn Tri Phương, Thạc Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2066484, 16.0576874, 'karaoke', -3, 'Google Places API'),
('GOD Bar Lounge', '115 Hà Bổng, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2444833, 16.0661887, 'karaoke', -3, 'Google Places API'),
('KARAOKE CAMEL 2', '7 Xuân Hòa 1, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1916035, 16.067663, 'karaoke', -3, 'Google Places API'),
('KARAOKE VICTORY KTV', '26XF+HQ4, Hòa Cường, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2244565, 16.0488813, 'karaoke', -3, 'Google Places API'),
('One More Craft Beer - Bia Thủ Công Đà Nẵng - 26 Quang Trung', '26 Quang Trung, Thạch Thang, Hải Châu, Đà Nẵng 50000, Vietnam', 108.2215811, 16.0751746, 'karaoke', -3, 'Google Places API'),
('Mystery Bar & Lounge', '47 D. Đình Nghệ, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2422923, 16.0687551, 'karaoke', -3, 'Google Places API'),
('Karaoke Diamond', 'Tầng 2 du thuyền MARINA, Đà Nẵng 550000, Vietnam', 108.2296419, 16.0643123, 'karaoke', -3, 'Google Places API'),
('Sun karaoke', '445 Đ. Trần Hưng Đạo, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2300505, 16.0647529, 'karaoke', -3, 'Google Places API'),
('Roma premium lounge', '21 Nguyễn Cao Luyện, An Hải, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2423188, 16.0695542, 'karaoke', -3, 'Google Places API'),
('KaraokeBinbin', '103 - 105 Huy Cận, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.2180645, 16.0330091, 'karaoke', -3, 'Google Places API'),
('Big Bang Karaoke', '47 Chính Hữu, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2401037, 16.0683658, 'karaoke', -3, 'Google Places API'),
('Karaoke Lasvegas', 'Khu công viên Bắc Đài tưởng niệm, Hoà Cường Bắc, Hải Châu, Đà Nẵng 50000, Vietnam', 108.2238248, 16.0458395, 'karaoke', -3, 'Google Places API'),
('Morning Star Karaoke', '311 Lê Thanh Nghị, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.2187366, 16.0333595, 'karaoke', -3, 'Google Places API'),
('Karaoke Lan Rừng', '75 Lý Tự Trọng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2163436, 16.0766783, 'karaoke', -3, 'Google Places API'),
('Karaoke Uyên♥️🌸🌸', '206 Đ. Nguyễn Hoàng, Phước Ninh, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2133658, 16.0596567, 'karaoke', -3, 'Google Places API'),
('New Oriental Nightclub', '20 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2209607, 16.0825358, 'karaoke', -3, 'Google Places API'),
('X8 KTV KARAOKE', 'Số 2 Đinh Thị Hòa, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2364519, 16.0710263, 'karaoke', -3, 'Google Places API'),
('Karaoke Gold', '115 Nguyễn Văn Thoại, An Hải Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2397048, 16.0544851, 'karaoke', -3, 'Google Places API'),
('Karaoke Siêu Sao', '17 Châu Thị Vĩnh Tế, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2396134, 16.0533148, 'karaoke', -3, 'Google Places API'),
('HeavenBar', '47 Ngô Thì Sĩ, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2442241, 16.0474647, 'karaoke', -3, 'Google Places API'),
('NEW WORLD KTV - 뉴월드 가라오케', '262 Đường võ nguyên giáp, Phước Mỹ, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2468583, 16.0566987, 'karaoke', -3, 'Google Places API'),
('Karaoke Anh Ca', '01 Châu Thị Vĩnh Tế, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2392818, 16.0534471, 'karaoke', -3, 'Google Places API'),
('Karaoke Gia Đình Lá Cọ', 'Đường Hòa Minh 2, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.160932, 16.0817014, 'karaoke', -3, 'Google Places API'),
('Kong 72 Speakeasy | Eat, Play, Love', '20 Mỹ Đa Đông 12, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2468745, 16.0454742, 'karaoke', -3, 'Google Places API'),
('Medical Center Lien Chieu District', '525 Tôn Đức Thắng, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 55550, Vietnam', 108.1555808, 16.0642451, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hải Châu 1', '239 Nguyễn Chí Thanh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.220955, 16.0667293, 'hospital_clinic', 8, 'Google Places API'),
('Trung tâm Y tế Quận Hải Châu - cs 2', '163 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2134806, 16.0716842, 'hospital_clinic', 8, 'Google Places API'),
('Hoa Tho Ward Clinics East', '28 Trần Ngọc Sương, Hòa Thọ Đông, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.1920262, 16.0061862, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Khuê Trung', '68 Lương Văn Can, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2112321, 16.0214011, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hòa Minh', '408 Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1651579, 16.0588409, 'hospital_clinic', 8, 'Google Places API'),
('Bệnh Viện Quân Y 17 - CHC - QK5', '3635+J7Q, Nguyễn Hữu Thọ, Hòa Thuận Nam, Hải Châu, Đà Nẵng 550000, Vietnam', 108.208233, 16.0540984, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế xã Hòa Phú', 'X3MF+XH9, Hoà Phú, Hòa Vang, Đà Nẵng, Vietnam', 108.0739877, 15.9849067, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường Hòa Cường Bắc', '44 Trần Văn Giáp, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Vietnam', 108.2155542, 16.0378099, 'hospital_clinic', 8, 'Google Places API'),
('Bệnh viện Đa khoa Tâm Trí Đà Nẵng', '64 Cách Mạng Tháng 8, Khuê Trung, Cẩm Lệ, Đà Nẵng, Vietnam', 108.2142153, 16.0229065, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hòa Cường Nam', '499 Núi Thành, Hoà Cường Nam, Hải Châu, Đà Nẵng, Vietnam', 108.222776, 16.033548, 'hospital_clinic', 8, 'Google Places API'),
('Hoa Khanh Ward Clinics North', '178 Âu Cơ, Hoà Khánh Bắc, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.145232, 16.0703941, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường Chính Gián', '104 Đ. Lê Độ, Chính Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2014473, 16.0678821, 'hospital_clinic', 8, 'Google Places API'),
('Bệnh viện đa khoa Hải Châu', '38 Cao Thắng, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2140648, 16.0765434, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Nại Hiên Đông', 'Nại Hiên Đông, Sơn Trà, Da Nang 550000, Vietnam', 108.2297696, 16.0859054, 'hospital_clinic', 8, 'Google Places API'),
('Trung Tâm Y Tế Quận Sơn Trà Cơ Sở', '1063 Ng. Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2355646, 16.058551, 'hospital_clinic', 8, 'Google Places API'),
('Sở Y Tế TP Đà Nẵng', '24 Trần Phú, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2228934, 16.077246, 'hospital_clinic', 8, 'Google Places API'),
('Trung tâm Y tế quận Cẩm Lệ', '105 Đ. Nguyễn Nhàn, Hòa Thọ Đông, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.1950824, 16.0103919, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Xuân Hà', '114 Trần Cao Vân, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2093652, 16.0727521, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hòa Hiệp Nam', '913 Nguyễn Lương Bằng, Hoà Hiệp Nam, Liên Chiểu, Đà Nẵng, Vietnam', 108.126622, 16.1077305, 'hospital_clinic', 8, 'Google Places API'),
('Health clinics Hoa Thuan Tay Ward', '26R5+WP9, Nguyễn Trác, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2093715, 16.0422759, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Thanh Khê Đông', '868 Trần Cao Vân, Thanh Khê Đông, Thanh Khê, Đà Nẵng, Vietnam', 108.1828924, 16.0682465, 'hospital_clinic', 8, 'Google Places API'),
('Medical Center Thanh Khe District', '359Q+9W9, Kiệt 62 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.189847, 16.0684145, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế xã Hòa Khương', 'X46R+G5H, Hoà Khương, Hòa Vang, Đà Nẵng, Vietnam', 108.1404901, 15.9613115, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Thanh Khê Đông', '3 Nguyễn Nghiêm, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1914913, 16.0618951, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Thạch Thang', '8 Nguyễn Thị Minh Khai, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2176554, 16.0759762, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Bình Thuận', 'K371/4 Trưng Nữ Vương, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 108.21595, 16.0507125, 'hospital_clinic', 8, 'Google Places API'),
('Clinics Thanh Khe Tay Ward', '33 Mẹ Nhu, Thanh Khê Tây, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1808347, 16.0665212, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường An Khê', '161 Trường Chinh, Hoà An, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1805213, 16.0574462, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Thạc Gián', '433 Lê Duẩn, Thạc Gián, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.2076791, 16.066997, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hải Châu 2', '564 Ông Ích Khiêm, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2157066, 16.0628924, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường Hòa An', '119 Đoàn Hữu Trưng, Hoà An, Cẩm Lệ, Đà Nẵng 59000, Vietnam', 108.179645, 16.0498231, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế xã Hòa Tiến', 'X59J+P9G, ĐT605, Hoà Tiến, Hòa Vang, Đà Nẵng, Vietnam', 108.1809559, 15.9693061, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Mỹ An', '4 Lưu Quang Thuận, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2449447, 16.0411533, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế xã Hòa Ninh', '333P+XQW, Đ. 602, Hoà Ninh, Hòa Vang, Đà Nẵng, Vietnam', 108.0869508, 16.054977, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Thanh Bình', '51 Thanh Thủy, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2130256, 16.0812552, 'hospital_clinic', 8, 'Google Places API'),
('Trung tâm Y tế quận Ngũ Hành Sơn', '582 Đ. Lê Văn Hiến, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2576855, 16.0085351, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế xã Hoà Sơn', '3495+W9W, Âu Cơ, Hoà Sơn, Hòa Vang, Đà Nẵng, Vietnam', 108.1084416, 16.0698572, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hòa Phát', '630 Trường Chinh, Hoà Phát, Cẩm Lệ, Đà Nẵng, Vietnam', 108.1854165, 16.0412818, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Bình Thuận', '163 Trưng Nữ Vương, Bình Thuận, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2203059, 16.0559694, 'hospital_clinic', 8, 'Google Places API'),
('Medical Center in Son Tra district', '1118 Ngô Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2348183, 16.0583129, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường An Hải Đông', '90 Nguyễn Duy Hiệu, An Hải Đông, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2389327, 16.0556052, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường Hòa Khánh Nam', '98 Hoàng Văn Thái, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1568224, 16.0567964, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Phước Ninh', '439 Ông Ích Khiêm, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2163511, 16.0621231, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Xuân Hà', '434 Trần Cao Vân, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1979245, 16.0712001, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hòa Thọ Tây', '252M+28P, Đường số 3, Hoà Thọ Tây, Cẩm Lệ, Đà Nẵng, Vietnam', 108.1833403, 16.0000967, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế xã Hòa Liên', '33XW+58Q, ĐT601, Thôn Quan, Hòa Vang, Đà Nẵng, Vietnam', 108.0958742, 16.0979751, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường Thuận Phước', '10 Phan Kế Bính, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2195376, 16.082217, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Phước Ninh', '47 Hoàng Văn Thụ, Phước Ninh, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2216858, 16.06266, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Khuê Mỹ', '26FX+QC3, Sen Hồng, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 108.2485361, 16.0243915, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường Hoà Hải', 'X7V4+FVC, Tây Sơn, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2571471, 15.993678, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Hòa Quý', 'X6PQ+2XQ, Mai Đăng Chơn, Hoà Quý, Ngũ Hành Sơn, Quảng Nam 550000, Vietnam', 108.2399828, 15.9850964, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y Tế Phường An Hải Tây', '25 Nguyễn Thông, An Hải Trung, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2308168, 16.0662907, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế xã Hòa Châu', 'X5PX+WQ2, QL1A, Hoà Châu, Hòa Vang, Đà Nẵng 550000, Vietnam', 108.1993728, 15.9872592, 'hospital_clinic', 8, 'Google Places API'),
('Trung Tâm Y Tế Huyện Hoà Vang', '2552+JMF, Xã Hoà Thọ, Huyện Hòa Vang, Hoà Ninh, Hòa Vang, Đà Nẵng, Vietnam', 108.1516875, 16.0090537, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Mân Thái', '261 Ng. Quyền, Mân Thái, Sơn Trà, Đà Nẵng, Vietnam', 108.2422758, 16.0890583, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường Thọ Quang', '36VX+2PV, Phan Bá Phiến, Thọ Quang, Sơn Trà, Đà Nẵng, Vietnam', 108.2492614, 16.0926462, 'hospital_clinic', 8, 'Google Places API'),
('Cam Thanh Commune Medical Center', 'V9H6+HW6, Thôn 4, Tp. Hội An, Quảng Nam, Vietnam', 108.3622686, 15.8789118, 'hospital_clinic', 8, 'Google Places API'),
('Hello Doctor', '14 Lê Doãn Nhạ, Hoà Khánh Nam, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1523346, 16.0689246, 'hospital_clinic', 8, 'Google Places API'),
('Trạm Y tế phường An Hải Bắc', '127 Đ. Nguyễn Trung Trực, An Hải Bắc, Sơn Trà, Đà Nẵng 550000, Vietnam', 108.2318473, 16.0799343, 'hospital_clinic', 8, 'Google Places API'),
('Thanh Khê Ward People''s Committee', '503 Trần Cao Vân, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1910553, 16.0707925, 'government_office', 5, 'Google Places API'),
('Ngũ Hành Sơn Ward People''s Committee', '486 Đ. Lê Văn Hiến, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 108.2537865, 16.0163759, 'government_office', 5, 'Google Places API'),
('People''s Committee of Hải Châu Ward', '76 Ông Ích Khiêm, Thanh Bình, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2120399, 16.0767887, 'government_office', 5, 'Google Places API'),
('Thuận Phước Ward People''s Committee', '88 Đống Đa, Thuận Phước, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2188781, 16.081422, 'government_office', 5, 'Google Places API'),
('Hòa Vang District People''s Committee', 'X4QQ+CMQ, Hoà Phong, Hòa Vang, Đà Nẵng, Vietnam', 108.1392243, 15.9885907, 'government_office', 5, 'Google Places API'),
('Hòa Hiệp Nam Ward People''s Committee', '2 Nguyễn Tất Thành, Hoà Hiệp Nam, Liên Chiểu, Đà Nẵng, Vietnam', 108.1264569, 16.1070992, 'government_office', 5, 'Google Places API'),
('Hòa Thọ Tây Ward People''s Committee', 'Cầu Đỏ, Túy Loan, Hoà Thọ Tây, Cẩm Lệ, Đà Nẵng, Vietnam', 108.1835844, 16.0000345, 'government_office', 5, 'Google Places API'),
('UBND Phường Hải Vân', '20 Nguyễn Phước Chu, Hoà Hiệp Bắc, Liên Chiểu, Đà Nẵng, Vietnam', 108.1210451, 16.1277572, 'government_office', 5, 'Google Places API'),
('People''s Court of Đà Nẵng', '374 Núi Thành, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Vietnam', 108.2213563, 16.0400325, 'government_office', 5, 'Google Places API'),
('Thành ủy Đà Nẵng', '72 Bạch Đằng, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2249991, 16.0705332, 'government_office', 5, 'Google Places API'),
('Nhà Sinh Hoạt Cộng Đồng (Ủy Ban Nhân Dân Phường Hòa Hải)', '2764+WRQ, Đ. Nguyễn Xiển, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng 550000, Vietnam', 108.2571265, 16.0123276, 'government_office', 5, 'Google Places API'),
('Danang Department of Home Affair', '24 Trần Phú, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2219336, 16.0774262, 'government_office', 5, 'Google Places API'),
('Quận ủy Hải Châu', '76 Quang Trung, Thạch Thang, Hải Châu, Đà Nẵng 550000, Vietnam', 108.219075, 16.0748164, 'government_office', 5, 'Google Places API'),
('Cảnh sát Phòng cháy và Chữa cháy Tp. Đà Nẵng', 'Cảnh sát PCCC, 183 Phan Đăng Lưu, Hoà Cường Bắc, Hải Châu, Đà Nẵng 550000, Vietnam', 108.2129753, 16.0354651, 'fire_station', 7, 'Google Places API'),
('Cảnh sát PCCC Và CNCH quận Hải Châu', '181a Phan Đăng Lưu, Hoà Cường Nam, Hải Châu, Đà Nẵng 550000, Vietnam', 108.213807, 16.0356236, 'fire_station', 7, 'Google Places API'),
('Sở Cảnh Sát Phòng Cháy Chữa Cháy', '612 Nguyễn Hữu Thọ, Khuê Trung, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2085826, 16.0250368, 'fire_station', 7, 'Google Places API'),
('Đội Cảnh sát Phòng Cháy & Chữa Cháy Ngũ Hành Sơn', '2792+C45, Nguyễn Đức Thuận, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng, Vietnam', 108.2504907, 16.0182791, 'fire_station', 7, 'Google Places API'),
('Đội Chữa cháy và CNCH - Khu vực 5', 'Trần Nam Trung, Hoà Xuân, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.2163774, 16.0017097, 'fire_station', 7, 'Google Places API'),
('Phòng Cảnh sát PC&CC Số 2', '210 Hà Huy Tập, Thanh Khê Đông, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1917023, 16.0616712, 'fire_station', 7, 'Google Places API'),
('Phòng Cảnh Sát Phòng Cháy Chữa Cháy Số 2', '2 Hà Huy Tập, Xuân Hà, Thanh Khê, Đà Nẵng 550000, Vietnam', 108.1918632, 16.0697012, 'fire_station', 7, 'Google Places API'),
('Bến Xe Khách Đà Nẵng', '354F+C65, Hoà An, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.1730944, 16.0560169, 'bus_station', -4, 'Google Places API'),
('Bến xe trung tâm Đà Nẵng', 'Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1725454, 16.0565364, 'bus_station', -4, 'Google Places API'),
('Da Nang Southern Intercity Bus Terminal (DLGL Group)', 'X696+3GH, QL1A, Hoà Phước, Hòa Vang, Đà Nẵng, Vietnam', 108.2113572, 15.9676795, 'bus_station', -4, 'Google Places API'),
('Bến xe Đức Long phía nam', 'QL1A, Hoà Phước, Hòa Vang, Đà Nẵng, Vietnam', 108.2116186, 15.9679478, 'bus_station', -4, 'Google Places API'),
('Danang Central Bus Station Taxi Stand', '2duong Đ.Đàm Văn Lễ, Hoà An, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1724814, 16.0551081, 'bus_station', -4, 'Google Places API'),
('Da Nang Bus Station', '201 Tôn Đức Thắng, Hoà Minh, Liên Chiểu, Đà Nẵng 550000, Vietnam', 108.1725622, 16.0555141, 'bus_station', -4, 'Google Places API'),
('Nhà gửi xe Bến xe trung tâm Đà Nẵng', 'Xe Trung Tâm, Bến, Tôn Đức Thắng, Hoà Minh, Cẩm Lệ, Đà Nẵng 550000, Vietnam', 108.1728391, 16.0564498, 'bus_station', -4, 'Google Places API'),
('Bến Xe Đà Nẵng', 'Hòa Minh, Cẩm Lệ District, Da Nang 550000, Vietnam', 108.1725251, 16.0565479, 'bus_station', -4, 'Google Places API');

--
-- Name: ai_generation_queue ai_generation_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_queue
    ADD CONSTRAINT ai_generation_queue_pkey PRIMARY KEY (id);


--
-- Name: ai_generation_queue ai_generation_queue_property_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_queue
    ADD CONSTRAINT ai_generation_queue_property_id_key UNIQUE (property_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_safety_scores property_safety_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_safety_scores
    ADD CONSTRAINT property_safety_scores_pkey PRIMARY KEY (property_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_property_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_property_id_user_id_key UNIQUE (property_id, user_id);


--
-- Name: safety_points safety_points_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.safety_points
    ADD CONSTRAINT safety_points_pkey PRIMARY KEY (id);


--
-- Name: security_incidents security_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_pkey PRIMARY KEY (id);


--
-- Name: idx_incidents_incident_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_incidents_incident_date ON public.security_incidents USING btree (incident_date);


--
-- Name: idx_incidents_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_incidents_property_id ON public.security_incidents USING btree (property_id);


--
-- Name: idx_properties_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_location ON public.properties USING btree (latitude, longitude);


--
-- Name: idx_queue_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queue_status ON public.ai_generation_queue USING btree (status);


--
-- Name: idx_reviews_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_property_id ON public.reviews USING btree (property_id);


--
-- Name: ai_generation_queue ai_generation_queue_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_queue
    ADD CONSTRAINT ai_generation_queue_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: property_safety_scores property_safety_scores_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_safety_scores
    ADD CONSTRAINT property_safety_scores_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: security_incidents security_incidents_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--