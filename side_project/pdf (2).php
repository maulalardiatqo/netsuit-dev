<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pc_head->pc_no_project_cost; ?></title>
    <style>
        body {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
        }

        #table {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            border-collapse: collapse;
            width: 100%;
        }

        #table2 {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
        }

        #table td,
        #table th {
            padding: 5px;
        }

        #table tr:nth-child(even) {
            background-color: #f2f2f2;
        }

        #table th {
            padding-top: 10px;
            padding-bottom: 10px;
            text-align: left;
            background-color: #4CAF50;
            color: white;
        }

        #table3 {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            font-size: 16px;
            width: 100%;
            border: 1px solid;
        }

        #table3 td,
        #table3 th {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            padding: 1px;
        }

        #table3isi {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            font-size: 16px;
            width: 100%;
        }

        #table3isi td,
        #table3isi th {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            padding: 1px;
        }

        .row {
            display: flex;
            flex-wrap: wrap;
            margin: -10px;
            /* negative margin to offset padding */
        }

        .col {
            box-sizing: border-box;
            /* include padding and border in width */
            padding: 10px;
            flex-grow: 1;
            /* allow columns to expand equally */
        }

        .col-1 {
            flex-basis: calc(8.33% - 20px);
            /* 8.33% width minus padding */
            max-width: calc(8.33% - 20px);
            /* limit max width to 8.33% */
        }

        .col-1-5 {
            flex-basis: calc(12.5% - 20px);
            /* 12.5% width minus padding */
            max-width: calc(12.5% - 20px);
            /* limit max width to 12.5% */
        }
    </style>
</head>
<?php
if ($pc_head->subsidiary_logo) {
    $path = '' . base_url() . '/media_library/logo/' . $pc_head->subsidiary_logo . '';
} else {
    $path = '' . base_url() . '/assets/assets/img/phintraco-new.jpg';
    $width_image = 'style="width: 50%; margin-bottom: 10px;"';
}
$type = pathinfo($path, PATHINFO_EXTENSION);
$data = file_get_contents($path);
$base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);

if ($pc_head->size == 'rectangle') {
    $width_image = 'style="width: 8%; margin-bottom: 15px;"';
} else {
    $width_image = 'style="width: 4%; margin-bottom: 10px;"';
}
?>

<body>
    <table id="table">
        <tr style="background-color: white;">
            <td colspan="2" style="text-align: center; vertical-align: middle;">
                <img src="<?php echo $base64 ?>" class="logo" <?= $width_image ?>>
            </td>
            <td colspan="5" style="text-align: center;">
                <div style="margin-bottom: 10px;"><b><?= strtoupper($pc_head->subsidiary_name); ?></b></div>
                <?php if ($pc_head->class_name) { ?>
                    <div style="margin-bottom: 10px;"><b><?= strtoupper($pc_head->class_name); ?></b></div>
                <?php } ?>
                <div style="margin-bottom: 10px;"><b>ESTIMASI BIAYA PROYEK</b></div>
            </td>
            <td colspan="2"></td>
        </tr>
        <tr>
            <td width="200"><b>NO. PROJECT COST</b></td>
            <td width="50">:</td>
            <td colspan="7"><?= $pc_head->pc_no_project_cost . ' ' . $pc_head->pc_revision ?></td>
        </tr>
        <tr>
            <td width="200"><b>DATE</b></td>
            <td width="50">:</td>
            <td colspan="7"><?= tgl_indo($pc_head->pc_date) ?></td>
        </tr>
        <tr>
            <td width="200"><b>CUSTOMER</b></td>
            <td width="50">:</td>
            <td colspan="7"><?= $pc_head->customer_name ?></td>
        </tr>
        <tr>
            <td width="200"><b>NAMA PROYEK</b></td>
            <td width="50">:</td>
            <td colspan="7"><?= $pc_head->pc_nama_proyek ?></td>
        </tr>
        <tr>
            <td width="200"><b>JENIS PROYEK</b></td>
            <td width="50">:</td>
            <td colspan="7"><?= $pc_head->pc_jenis_proyek ?></td>
        </tr>
        <tr>
            <td width="200"><b>PERIODE PROYEK</b></td>
            <td width="50">:</td>
            <td colspan="7"><?= tgl_indo($pc_head->pc_mulai_proyek) . ' s/d ' . tgl_indo($pc_head->pc_akhir_periode_proyek) ?></td>
        </tr>
        <tr>
            <td width="200"><b>NOMOR PKS </b></td>
            <td width="50">:</td>
            <td colspan="7"><?= $pc_head->pc_nomor_pks ?></td>
        </tr>
    </table>
    <div style="margin-top: 25px;"></div>
    <table id="table">
        <tr style="background-color: white;">
            <td colspan="2" rowspan="3" style="border-top: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; border-left: 1px solid black; text-align:center; vertical-align:middle; width: 500px;"><b>Keterangan</b></td>
            <td colspan="3" rowspan="2" style="border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center; vertical-align:middle;"><b>Estimasi</b></td>
            <td colspan="3" style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center;"><b>Aktual</b></td>
            <td rowspan="3" colspan="2" style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center;"><b>Selisih (+/-)</b></td>
            <td rowspan="3" style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center; width: 300px;"><b>Keterangan</b></td>
            <td rowspan="3" style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center;"><b>Persetujuan</b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="3" style="text-align:center;"><b><?= $pc_head->period_name ?></b></td>
        </tr>
        <tr style="background-color: white;">
            <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right:1px solid black; text-align:center;"><b>Unit</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center;"><b>Nominal (Rp)</b></td>
            <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center;"><b>Unit</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align:center;"><b>Nominal (Rp)</b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="12" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b>PENDAPATAN</b></td>
        </tr>
        <?php $totalEsNominal = 0;
        $hitung_baris = 12;
        foreach ($pc_detail as $key => $row) { ?>
            <?php if ($row->pcd_type == '') { ?>
                <?php
                $totalEsNominal += $row->pcd_estimasi_nominal;
                $hitung_baris++;
                ?>
                <tr style="background-color: white;">
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;" width="100"></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><?= $row->item_name ?></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align: right;"><?= $row->pcd_estimasi_unit ?></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-left: 1px solid black; text-align: right;">Rp.</td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdf($row->pcd_estimasi_nominal) ?></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align: right;"><?= $row->pcd_actual_po ?></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-left: 1px solid black; text-align: right;">Rp.</td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdf($row->pcd_actual_nominal) ?></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-left: 1px solid black; text-align: right;">Rp.</td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdf($row->pcd_selisih) ?></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><?= $row->pcd_keterangan_line ?></td>
                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><?= $row->pcd_persetujuan ?></td>
                </tr>
            <?php } ?>
        <?php } ?>
        <tr style="background-color: white;">
            <td colspan="12" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b></b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b>TOTAL PENDAPATAN</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-left: 1px solid black; text-align: right;"><b>Rp.</b></td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><b><?= formatCurrencyPdf($totalEsNominal) ?></b></td>
            <td colspan="7" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b></b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="12" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b>BIAYA</b></td>
        </tr>

        <?php
        $rowspanUnit = 0;
        foreach ($pc_detail as $key => $row) {
            if ($row->pcd_type != '') {
                $rowspanUnit++;
            }
        }
        ?>
        <?php
        $groupedArray = array_reduce($pc_detail, function ($acc, $item) {
            $pcd_type = $item->pcd_type;
            if (!isset($acc[$pcd_type])) {
                $acc[$pcd_type] = [];
            }
            $acc[$pcd_type][] = $item;
            return $acc;
        }, []);
        ?>

        <?php $i = 0;
        $totalBiayaProyek = 0;
        $hitung_baris += 3;
        $baris_perhal = $hitung_baris;
        $halaman = 0;
        foreach ($groupedArray as $pcd_type => $item) { ?>
            <?php if ($pcd_type) {
                $rowspan = count($item);
                $sisa_rowspan = $rowspan;
                $sisa_baris = 0;
                $i++; ?>

                <?php
                if ($hitung_baris <= 46) {
                    $halaman = 1;
                    while (($sisa_rowspan + $baris_perhal) > 46) {
                        $sisa_rowspan--;
                    }
                } else {
                    $halaman++;
                    while (($sisa_rowspan + $baris_perhal) > 51) {
                        $sisa_rowspan--;
                    }
                }
                ?>
                <?php foreach ($item as $index => $row) {
                    $isCofItem = isCOFItem('ns_name', $row->item_name, 'ns_list_item_pc');
                    $hitung_baris++;
                    $baris_perhal++;
                    $totalBiayaProyek += $row->pcd_estimasi_nominal ?>
                    <tr>
                        <?php if ($hitung_baris <= 46 || $baris_perhal <= 51) { ?>
                            <?php if ($index < 1) { ?>
                                <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; background-color: white; width: 130;" rowspan="<?= $sisa_rowspan; ?>"><b><?= $i . '. ' . $pcd_type; ?></b></td>
                            <?php } else if (($baris_perhal == 1 && $halaman == 1) || ($baris_perhal == 1 && $halaman > 1)) { ?>
                                <?php if (($rowspan - $sisa_rowspan) > 51) {
                                    $batas_rowspan = 51;
                                    $rowspan -= 51; ?>
                                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; background-color: white; width: 130;" rowspan="<?= $batas_rowspan; ?>"><b><?= $i . '. ' . $pcd_type; ?></b></td>
                                <?php } else {
                                    $batas_rowspan = ($rowspan - $sisa_rowspan); ?>
                                    <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; background-color: white; width: 130;" rowspan="<?= $batas_rowspan; ?>"><b><?= $i . '. ' . $pcd_type; ?></b></td>
                                <?php } ?>
                            <?php } ?>
                        <?php } ?>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><?= $row->item_name ?></td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; text-align: right;"><?= $row->pcd_estimasi_unit ?></td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-left: 1px solid black; text-align: right;">Rp.</td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdf($row->pcd_estimasi_nominal) ?></td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><?= $row->pcd_actual_po ?></td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-left: 1px solid black; text-align: right;">Rp.</td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdf($row->pcd_actual_nominal) ?></td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-left: 1px solid black; text-align: right;">Rp.</td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; text-align: right;"><?= formatCurrencyPdf($row->pcd_selisih) ?></td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><?= $isCofItem == 'T' ? ($row->pcd_cof_percent * 100) . '%' : $row->pcd_keterangan_line ?></td>
                        <td style="border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><?= $row->pcd_persetujuan ?></td>
                    </tr>
                <?php
                    $sisa_baris = $baris_perhal;
                    if ($halaman == 1) {
                        $baris_perhal = ($baris_perhal == 46 ? 0 : $baris_perhal);
                    } else {
                        $baris_perhal = ($baris_perhal == 51 ? 0 : $baris_perhal);
                    }
                } ?>
            <?php } ?>
        <?php } ?>

        <?php if ($sisa_baris > 46) { ?>
            <?php for ($i = $sisa_baris; $i <= 51; $i++) { ?>
                <tr style="background-color: white;">
                    <td colspan="12"></td>
                </tr>
            <?php } ?>
        <?php } ?>
        <tr style="background-color: white;">
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; border-top: 1px solid black;"><b>TOTAL BIAYA PROYEK</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-left: 1px solid black; text-align: right; border-top: 1px solid black;"><b>Rp.</b></td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right; border-top: 1px solid black;"><b><?= formatCurrencyPdf($totalBiayaProyek) ?></b></td>
            <td colspan="7" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black; border-top: 1px solid black;"><b></b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b>TOTAL SELISIH PENDAPATAN & BIAYA</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-left: 1px solid black; text-align: right;"><b>Rp.</b></td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><b><?= ($totalBiayaProyek && $totalEsNominal) ? formatCurrencyPdf($totalEsNominal - $totalBiayaProyek) : '-' ?></b></td>
            <td colspan="7" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b></b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b>TOTAL SELISIH BIAYA (MTD)</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-left: 1px solid black; text-align: right;"><b></b></td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><b></b></td>
            <td colspan="7" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b></b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b>TOTAL SELISIH BIAYA (YTD)</b></td>
            <td colspan="2" style="border-bottom: 1px solid black; border-left: 1px solid black; text-align: right;"><b></b></td>
            <td style="border-bottom: 1px solid black; border-right: 1px solid black; text-align: right;"><b></b></td>
            <td colspan="7" style="border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;"><b></b></td>
        </tr>
        <tr style="background-color: white;">
            <td colspan="12"></td>
        </tr>
    </table>
    <p>
        <b>Note : <?= nl2br($pc_head->pc_note) ?></b>
    </p>
    <div style="margin-top: 25px;"></div>
    <?php
    $total_approval = count($approval);
    $width = 0;
    if ($total_approval < 6) {
        $width = 60;
    } else {
        $width = 75;
    }
    ?>
    <table style="margin-left: auto; width: <?= $width; ?>%;" id="table3">
        <tr>
            <th style="text-align:center;vertical-align:top; border-right: 1px solid; border-bottom: 1px solid; width: 20%; vertical-align: middle;">DIBUAT OLEH</th>
            <th style="text-align:center;vertical-align:top; border-right: 1px solid; border-bottom: 1px solid; width: 20%; vertical-align: middle;">DIPERIKSA OLEH</th>
            <th style="text-align:center;vertical-align:top; border-right: 1px solid; border-bottom: 1px solid; width: 20%; vertical-align: middle;">DIKETAHUI OLEH</th>
            <th style="text-align:center;vertical-align:top; border-right: 1px solid; border-bottom: 1px solid; width: 20%; vertical-align: middle;">DISETUJUI OLEH</th>
            <th style="text-align:center;vertical-align:top; border-bottom: 1px solid; width: 20%; vertical-align: middle;">DISETUJUI OLEH : <br /> DIREKTUR FINANCE</th>
        </tr>
        <tr>
            <td style="text-align:center;vertical-align:top; border-right: 1px solid;">
                <table id="table3isi">
                    <tr>
                        <?php foreach ($approval as $key => $apv) : ?>
                            <?php if ($apv->group == 'Created By') { ?>
                                <?php
                                $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                                $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                                $type = pathinfo($path, PATHINFO_EXTENSION);
                                $data = file_get_contents($path);
                                $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                                ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <?php if ($apv->approval_status == "APPROVE") { ?>
                                                <td style="text-align: center;">
                                                    <br /><img src="<?= $base64; ?>" width="200" height="154">
                                                </td>
                                            <?php } else { ?>
                                                <td style="text-align: center;"><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /></td>
                                            <?php } ?>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; border-bottom: 1px dotted black;">
                                                <br /><?= $apv->fullname; ?>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                        <?php endforeach; ?>
                    </tr>
                </table>
            </td>
            <td style="vertical-align: top; border-right: 1px solid;">
                <table id="table3isi">
                    <tr>
                        <?php foreach ($approval as $key => $apv) : ?>
                            <?php
                            $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                            $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                            $type = pathinfo($path, PATHINFO_EXTENSION);
                            $data = file_get_contents($path);
                            $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                            ?>
                            <?php if ($apv->group == 'Checked By') { ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <?php if ($apv->approval_status == "APPROVE") { ?>
                                                <td style="text-align: center;">
                                                    <br /><img src="<?= $base64; ?>" width="200" height="154">
                                                </td>
                                            <?php } else { ?>
                                                <td style="text-align: center;"><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /></td>
                                            <?php } ?>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; border-bottom: 1px dotted black;">
                                                <br /><?= $apv->fullname; ?>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                        <?php endforeach; ?>
                    </tr>
                </table>
            </td>
            <td style="vertical-align: top; border-right: 1px solid;">
                <table id="table3isi">
                    <tr>
                        <?php foreach ($approval as $key => $apv) : ?>
                            <?php
                            $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                            $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                            $type = pathinfo($path, PATHINFO_EXTENSION);
                            $data = file_get_contents($path);
                            $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                            ?>
                            <?php if ($apv->group == 'Acknowledge By') { ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <?php if ($apv->approval_status == "APPROVE") { ?>
                                                <td style="text-align: center;">
                                                    <br /><img src="<?= $base64; ?>" width="200" height="154">
                                                </td>
                                            <?php } else { ?>
                                                <td style="text-align: center;"><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /></td>
                                            <?php } ?>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; border-bottom: 1px dotted black;">
                                                <br /><?= $apv->fullname; ?>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                        <?php endforeach; ?>
                    </tr>
                </table>
            </td>
            <td style="vertical-align: top; border-right: 1px solid;">
                <table id="table3isi">
                    <tr>
                        <?php foreach ($approval as $key => $apv) : ?>
                            <?php
                            $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                            $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                            $type = pathinfo($path, PATHINFO_EXTENSION);
                            $data = file_get_contents($path);
                            $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                            ?>
                            <?php if ($apv->group == 'Approved By') { ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <?php if ($apv->approval_status == "APPROVE") { ?>
                                                <td style="text-align: center;">
                                                    <br /><img src="<?= $base64; ?>" width="200" height="154">
                                                </td>
                                            <?php } else { ?>
                                                <td style="text-align: center;"><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /></td>
                                            <?php } ?>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; border-bottom: 1px dotted black;">
                                                <br /><?= $apv->fullname; ?>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                        <?php endforeach; ?>
                    </tr>
                </table>
            </td>
            <td style="vertical-align: top;">
                <table id="table3isi">
                    <tr>
                        <?php foreach ($approval as $key => $apv) : ?>
                            <?php
                            $img_paraf = $apv->signature ? $apv->signature : 'default-image.png';
                            $path = '' . base_url() . '/media_library/users/' . $img_paraf . '';
                            $type = pathinfo($path, PATHINFO_EXTENSION);
                            $data = file_get_contents($path);
                            $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                            ?>
                            <?php if ($apv->group == 'Approved By The Financial Director') { ?>
                                <td>
                                    <table id="table3isi">
                                        <tr>
                                            <?php if ($apv->approval_status == "APPROVE") { ?>
                                                <td style="text-align: center;">
                                                    <br /><img src="<?= $base64; ?>" width="200" height="154">
                                                </td>
                                            <?php } else { ?>
                                                <td style="text-align: center;"><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /></td>
                                            <?php } ?>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; border-bottom: 1px dotted black;">
                                                <br /><?= $apv->fullname; ?>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            <?php } ?>
                        <?php endforeach; ?>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>